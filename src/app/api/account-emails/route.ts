import { z } from 'zod';
import { getFirebaseServer } from '@/lib/firebase/server';
import { accountActionUrl, emailAppOrigin } from '@/lib/email/config';
import { EmailLimitError, reserveAccountEmail } from '@/lib/email/delivery';
import { requireGmailConfiguration, sendAccountEmail } from '@/lib/email/transport';

export const runtime = 'nodejs';
export const maxDuration = 60;

const inputSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('verification') }).strict(),
  z.object({ kind: z.literal('welcome') }).strict(),
  z.object({ kind: z.literal('password-reset'), email: z.string().trim().max(254).email().transform((email) => email.toLowerCase()) }).strict(),
]);
const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const accepted = () => json({ success: true });

async function readInput(request: Request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2048) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; } catch { return null; }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site'
    || (origin && origin !== new URL(request.url).origin)) {
    return json({ error: 'Requête non autorisée.' }, 403);
  }
  const parsed = inputSchema.safeParse(await readInput(request));
  if (!parsed.success) return json({ error: 'Requête invalide.' }, 400);
  const input = parsed.data;
  let reservation: Awaited<ReturnType<typeof reserveAccountEmail>> = null;
  let smtpAccepted = false;
  try {
    requireGmailConfiguration();
    const appOrigin = emailAppOrigin();
    const { auth, db } = getFirebaseServer();
    // Vercel fournit cet en-tête et remplace la valeur du client. Hors Vercel,
    // un budget commun protège le service sans faire confiance à une IP fournie.
    const ip = process.env.VERCEL ? (request.headers.get('x-vercel-forwarded-for') || 'unknown') : 'local';
    let email: string;
    let uid: string | undefined;
    if (input.kind === 'password-reset') {
      email = input.email;
    } else {
      const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
      if (!token) return json({ error: 'Connectez-vous pour recevoir cet e-mail.' }, 401);
      const identity = await auth.verifyIdToken(token, true);
      const user = await auth.getUser(identity.uid);
      if (!user.email || user.disabled) return json({ error: 'Compte indisponible.' }, 403);
      if (input.kind === 'verification' && user.emailVerified) return accepted();
      if (input.kind === 'welcome' && !user.emailVerified) return json({ error: 'Confirmez d’abord votre adresse.' }, 403);
      uid = user.uid;
      email = user.email.toLowerCase();
      const profile = await db.collection('profiles').doc(uid).get();
      if (!profile.exists || ['suspended', 'deleting'].includes(profile.get('accountStatus'))) {
        return json({ error: 'Compte indisponible.' }, 403);
      }
    }

    reservation = await reserveAccountEmail(input.kind, email, ip, uid);
    if (!reservation) return accepted();
    let actionUrl: string;
    if (input.kind === 'welcome') {
      actionUrl = `${appOrigin}/proprietaire/tableau-de-bord`;
    } else {
      const settings = { url: `${appOrigin}/connexion`, handleCodeInApp: false };
      try {
        if (input.kind === 'password-reset') {
          const user = await auth.getUserByEmail(email);
          if (user.disabled) { await reservation.finish('skipped'); return accepted(); }
        }
        const firebaseLink = input.kind === 'verification'
          ? await auth.generateEmailVerificationLink(email, settings)
          : await auth.generatePasswordResetLink(email, settings);
        actionUrl = accountActionUrl(firebaseLink, input.kind, appOrigin);
      } catch (cause) {
        if (input.kind === 'password-reset' && (cause as { code?: string }).code === 'auth/user-not-found') {
          await reservation.finish('skipped');
          return accepted();
        }
        throw cause;
      }
    }
    await sendAccountEmail(email, input.kind, actionUrl);
    smtpAccepted = true;
    await reservation.finish('accepted');
    return accepted();
  } catch (cause) {
    // Un échec du journal après acceptation SMTP ne doit pas annoncer à tort
    // un échec d'envoi et provoquer un doublon. Le bail de l'événement est conservé.
    if (smtpAccepted) {
      console.error('account-email: delivery-log-failed');
      return accepted();
    }
    const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
    await reservation?.finish('failed').catch(() => console.error('account-email: failure-log-failed'));
    if (cause instanceof EmailLimitError) {
      // Même résultat pour une adresse inexistante ou temporairement limitée.
      if (input.kind === 'password-reset' && cause.scope === 'recipient') return accepted();
      return json({ error: 'Patientez quelques instants avant de demander un nouveau lien.', code: 'auth/too-many-requests' }, 429);
    }
    if (['auth/id-token-expired', 'auth/id-token-revoked', 'auth/argument-error', 'auth/invalid-id-token', 'auth/user-disabled', 'auth/user-not-found'].includes(code)) {
      return json({ error: 'Votre session a expiré. Reconnectez-vous.' }, 401);
    }
    const configurationMissing = cause instanceof Error && (cause.message.includes('not-configured') || cause.message.includes('app-url-') || cause.message.includes('project-mismatch'));
    // Ne jamais journaliser cause, qui peut contenir l'adresse ou une réponse SMTP.
    console.error(configurationMissing ? 'account-email: configuration-missing' : 'account-email: delivery-failed');
    return json({ error: 'L’envoi est momentanément indisponible. Votre compte reste accessible ; réessayez plus tard.' }, configurationMissing ? 503 : 502);
  }
}
