'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

export type SubscriptionPlan = 'free' | 'pro' | 'business';

export function useSubscription() {
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let stopProfile: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopProfile?.();
      if (!user) {
        setPlan('free');
        setIsLoading(false);
        return;
      }
      stopProfile = onSnapshot(doc(firestore, 'profiles', user.uid), (snapshot) => {
        const value = snapshot.data()?.subscriptionPlan;
        setPlan(value === 'pro' || value === 'business' ? value : 'free');
        setIsLoading(false);
      }, () => {
        setPlan('free');
        setIsLoading(false);
      });
    });
    return () => { stopProfile?.(); stopAuth(); };
  }, []);

  return {
    plan,
    isLoading,
    isPaid: plan === 'pro' || plan === 'business',
    isBusiness: plan === 'business',
  };
}
