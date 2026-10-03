import { CONTACT_EMAIL } from '@/config/contact';

export const EMAIL_SENDER = { name: 'Mon Livret', address: CONTACT_EMAIL } as const;

export function emailAppOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
    || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');
  if (!configured) throw new Error('email/app-url-missing');
  const url = new URL(configured);
  if (url.username || url.password || (url.protocol !== 'https:'
    && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
    throw new Error('email/app-url-invalid');
  }
  return url.origin;
}

export function accountActionUrl(firebaseLink: string, kind: 'verification' | 'password-reset', origin: string) {
  const code = new URL(firebaseLink).searchParams.get('oobCode');
  if (!code) throw new Error('email/action-code-missing');
  const url = new URL(kind === 'verification' ? '/confirmer-adresse' : '/reinitialiser-mot-de-passe', origin);
  url.searchParams.set('oobCode', code);
  return url.href;
}
