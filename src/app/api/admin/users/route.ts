import { deleteOwnerAccount, FirebaseAdminRestError, isAdminDeletionConfigured } from '@/lib/firebase/admin-rest';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ hardDeleteConfigured: isAdminDeletionConfigured() });
}

export async function DELETE(request: Request) {
  const authorization = request.headers.get('authorization');
  const idToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!idToken) {
    return Response.json({ error: 'Connectez-vous avec un compte administrateur.' }, { status: 401 });
  }

  let body: { uid?: unknown; confirmationEmail?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return Response.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (typeof body.uid !== 'string' || typeof body.confirmationEmail !== 'string') {
    return Response.json({ error: 'Compte ou e-mail de confirmation manquant.' }, { status: 400 });
  }

  try {
    const result = await deleteOwnerAccount({
      idToken,
      targetUid: body.uid,
      confirmationEmail: body.confirmationEmail,
    });
    return Response.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof FirebaseAdminRestError) {
      const status = {
        configuration: 503,
        unauthorized: 401,
        forbidden: 403,
        'not-found': 404,
        conflict: 409,
        'firebase-admin': 502,
      }[error.code];
      return Response.json({ error: error.message }, { status });
    }
    return Response.json({ error: 'La suppression a échoué. L’accès du compte reste bloqué; vous pouvez relancer l’opération.' }, { status: 500 });
  }
}
