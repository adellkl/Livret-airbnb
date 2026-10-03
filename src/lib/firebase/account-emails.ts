import { type User } from 'firebase/auth';

async function requestAccountEmail(body: { kind: string; email?: string }, user?: User) {
  const token = user ? await user.getIdToken() : undefined;
  const response = await fetch('/api/account-emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null) as { error?: string; code?: string } | null;
  if (!response.ok) {
    const error = new Error(result?.error || 'L’e-mail n’a pas pu être envoyé.') as Error & { code?: string };
    error.code = result?.code;
    throw error;
  }
}

// Tous les emails du site passent par ce point d'entrée. Aucun secret SMTP
// ni lien d'administration n'est transmis au navigateur.
export async function sendRegistrationConfirmation(user: User) {
  if (user.emailVerified) return;
  await requestAccountEmail({ kind: 'verification' }, user);
}

export async function sendAccountPasswordReset(email: string) {
  await requestAccountEmail({ kind: 'password-reset', email: email.trim().toLowerCase() });
}

export async function sendWelcomeEmail(user: User) {
  await requestAccountEmail({ kind: 'welcome' }, user);
}
