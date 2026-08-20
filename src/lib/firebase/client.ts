import { getApp, getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Firebase web configuration is public by design. The fallbacks let static
  // builds complete even when a hosting provider has not injected .env.local.
  // Environment variables still take precedence for every deployment.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCy0u_hD47oZrAlgXsKTsyNFYLioB1Tgyk',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'livret-airbnb-a871e.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'livret-airbnb-a871e',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'livret-airbnb-a871e.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1082913311627',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1082913311627:web:eed49736c7eecc82c77d8e',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-PFBYQSW997',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);

// The owner session is intentionally retained across refreshes and browser restarts.
// Pages can await this promise before relying on `currentUser`.
export const firebaseAuthReady = setPersistence(
  firebaseAuth,
  browserLocalPersistence,
).then(() => firebaseAuth.authStateReady());

export const firestore = getFirestore(app);
export const firebaseStorage = getStorage(app);
