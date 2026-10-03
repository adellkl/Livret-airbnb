import 'server-only';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function getFirebaseServer() {
  const name = 'monlivret-server';
  let app = getApps().find((item) => item.name === name);
  if (!app) {
    const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
    const account = raw ? JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string } : {};
    const projectId = account.project_id || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = account.client_email || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = (account.private_key || process.env.FIREBASE_ADMIN_PRIVATE_KEY)?.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) throw new Error('email/server-not-configured');
    if (projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) throw new Error('email/project-mismatch');
    app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, name);
  }
  return { auth: getAuth(app), db: getFirestore(app) };
}
