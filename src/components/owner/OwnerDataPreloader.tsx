'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';

import { firebaseAuth, firestore } from '@/lib/firebase/client';

/**
 * Keeps the Firebase SDK's in-memory cache warm while the owner navigates
 * between pages. Each screen can still keep its own rendering logic, but its
 * first Firestore read is now normally served from this shared live cache.
 */
export default function OwnerDataPreloader() {
  useEffect(() => {
    let stops: Array<() => void> = [];

    const clearListeners = () => {
      stops.forEach((stop) => stop());
      stops = [];
    };

    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      clearListeners();
      if (!user) return;

      stops.push(onSnapshot(doc(firestore, 'profiles', user.uid), () => undefined, () => undefined));

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
  }, []);

  return null;
}
