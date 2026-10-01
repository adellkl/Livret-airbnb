'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/config/routes';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

/**
 * Keeps the Firebase SDK's in-memory cache warm while the owner navigates
 * between pages. Each screen can still keep its own rendering logic, but its
 * first Firestore read is now normally served from this shared live cache.
 */
export default function OwnerDataPreloader() {
  const router = useRouter();

  useEffect(() => {
    let stops: Array<() => void> = [];
    let revokingAccess = false;

    const clearListeners = () => {
      stops.forEach((stop) => stop());
      stops = [];
    };

    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      clearListeners();
      revokingAccess = false;
      if (!user) return;

      stops.push(onSnapshot(doc(firestore, 'profiles', user.uid), (profile) => {
        const status = profile.data()?.accountStatus;
        if (revokingAccess || (status !== 'suspended' && status !== 'deleting')) return;
        revokingAccess = true;
        clearListeners();
        void signOut(firebaseAuth).finally(() => router.replace(ROUTES.LOGIN));
      }, () => undefined));

      [
        'properties',
        'public_guides',
        'reservations',
        'guide_messages',
        'guide_events',
        'guide_reviews',
      ].forEach((collectionName) => {
        stops.push(onSnapshot(
          query(collection(firestore, collectionName), where('ownerId', '==', user.uid)),
          () => undefined,
          () => undefined,
        ));
      });
    });

    return () => {
      clearListeners();
      stopAuth();
    };
  }, [router]);

  return null;
}
