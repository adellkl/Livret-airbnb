'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseAuthReady } from '@/lib/firebase/client';
import { createOwnerProfile } from '@/lib/firebase/profile';
import { firestore } from '@/lib/firebase/client';
import { ROUTES } from '@/config/routes';

type GoogleSignInButtonProps = {
  className: string;
  onError: (message: string) => void;
};

export default function GoogleSignInButton({ className, onError }: GoogleSignInButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const finishGoogleSignIn = useCallback(async (credential: UserCredential) => {
    const profileRef = doc(firestore, 'profiles', credential.user.uid);
    const existingProfile = await getDoc(profileRef);
    let role = existingProfile.data()?.role;

    if (!existingProfile.exists()) {
      await createOwnerProfile({
        uid: credential.user.uid,
        email: credential.user.email,
        fullName: credential.user.displayName ?? '',
        organizationName: '',
        activityType: '',
      });
      role = 'owner';
    }

    router.replace(role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.OWNER_DASHBOARD);
    router.refresh();
  }, [router]);

  useEffect(() => {
    let active = true;
    const completeRedirect = async () => {
      try {
        await firebaseAuthReady;
        const credential = await getRedirectResult(firebaseAuth);
        if (credential && active) await finishGoogleSignIn(credential);
      } catch (error) {
        if (active) {
          const code = error instanceof Error ? error.message : '';
          onError(code.includes('auth/unauthorized-domain')
            ? 'Ce domaine n’est pas autorisé par Firebase. Ajoutez votre domaine Vercel dans Firebase Authentication → Domaines autorisés.'
            : 'La connexion Google n’a pas abouti. Réessayez ou utilisez votre adresse e-mail.');
          setIsLoading(false);
        }
      }
    };
    void completeRedirect();
    return () => { active = false; };
  }, [finishGoogleSignIn, onError]);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    onError('');

    try {
      await firebaseAuthReady;
      const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      await finishGoogleSignIn(credential);
    } catch (signInError) {
      const code = signInError instanceof Error ? signInError.message : '';
      if (code.includes('auth/unauthorized-domain')) {
        onError('Ce domaine n’est pas autorisé par Firebase. Ajoutez localhost dans Authentication → Paramètres → Domaines autorisés.');
      } else if (code.includes('auth/popup-blocked')) {
        // The popup is not available in some embedded browsers. Redirecting in
        // the same tab is reliable there and returns here after Google login.
        await signInWithRedirect(firebaseAuth, new GoogleAuthProvider());
        return;
      } else if (code.includes('auth/popup-closed-by-user')) {
        onError('La fenêtre de connexion Google a été fermée avant la fin. Réessayez.');
      } else if (code.includes('auth/operation-not-allowed')) {
        onError('La connexion Google doit être activée dans Firebase Authentication.');
      } else {
        onError('La connexion Google n’a pas abouti. Réessayez ou utilisez votre adresse e-mail.');
      }
      setIsLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" disabled={isLoading} onClick={signInWithGoogle} className={className}>
      <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#1f2925]/10 text-xs font-bold">G</span>
      {isLoading ? 'Connexion à Google…' : 'Continuer avec Google'}
    </Button>
  );
}
