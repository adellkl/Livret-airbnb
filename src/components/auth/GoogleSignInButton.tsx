'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
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

function googleSignInErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const detail = error instanceof Error ? error.message : '';
  const reason = `${code} ${detail}`;

  if (reason.includes('auth/unauthorized-domain')) {
    return `Le domaine ${window.location.hostname} n’est pas autorisé dans Firebase Authentication. Ajoutez-le dans Authentication → Paramètres → Domaines autorisés.`;
  }
  if (reason.includes('auth/operation-not-allowed')) {
    return 'La connexion Google n’est pas activée dans Firebase Authentication.';
  }
  if (reason.includes('auth/popup-closed-by-user')) {
    return 'La fenêtre Google a été fermée avant la fin de la connexion. Réessayez.';
  }
  if (reason.includes('auth/popup-blocked')) {
    return 'Le navigateur a bloqué la fenêtre Google. Autorisez les fenêtres surgissantes ou ouvrez le site dans un navigateur classique.';
  }
  if (reason.includes('auth/network-request-failed')) {
    return 'La connexion à Google a échoué. Vérifiez votre connexion internet et réessayez.';
  }
  if (reason.includes('permission-denied')) {
    return 'Google a répondu, mais Firebase a refusé l’accès au profil. Vérifiez les règles Firestore du projet de production.';
  }
  if (reason.includes('app/google-profile-timeout')) {
    return 'Google vous a connecté, mais Firebase tarde à ouvrir le profil. Vérifiez les règles Firestore et la configuration du projet de production.';
  }
  if (reason.includes('auth/web-storage-unsupported') || reason.includes('auth/operation-not-supported-in-this-environment')) {
    return 'Ce navigateur bloque le stockage nécessaire à la connexion. Ouvrez le site dans un navigateur classique.';
  }
  return 'La connexion Google n’a pas abouti. Vérifiez la configuration OAuth de production puis réessayez.';
}

function withTimeout<T>(operation: Promise<T>, timeoutMs = 20_000) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('app/google-profile-timeout')), timeoutMs);
    operation.then(
      (value) => { window.clearTimeout(timeout); resolve(value); },
      (error: unknown) => { window.clearTimeout(timeout); reject(error); },
    );
  });
}

export default function GoogleSignInButton({ className, onError }: GoogleSignInButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const finishGoogleSignIn = useCallback(async (credential: UserCredential) => {
    const profileRef = doc(firestore, 'profiles', credential.user.uid);
    const existingProfile = await withTimeout(getDoc(profileRef));
    let role = existingProfile.data()?.role;

    if (['suspended', 'deleting'].includes(existingProfile.data()?.accountStatus)) {
      await signOut(firebaseAuth);
      onError('Ce compte est suspendu. Contactez un administrateur.');
      return;
    }

    if (!existingProfile.exists()) {
      await withTimeout(createOwnerProfile({
        uid: credential.user.uid,
        email: credential.user.email,
        fullName: credential.user.displayName ?? '',
        organizationName: '',
        activityType: '',
      }));
      role = 'owner';
    }

    router.replace(role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.OWNER_DASHBOARD);
    router.refresh();
  }, [onError, router]);

  useEffect(() => {
    let active = true;
    const completeRedirect = async () => {
      try {
        await firebaseAuthReady;
        const credential = await getRedirectResult(firebaseAuth);
        if (credential && active) {
          await finishGoogleSignIn(credential);
        } else if (active) {
          setIsLoading(false);
        }
      } catch (error) {
        if (active) {
          onError(googleSignInErrorMessage(error));
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
      const code = signInError && typeof signInError === 'object' && 'code' in signInError ? String(signInError.code) : '';
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        // Some embedded browsers close the Firebase popup before its result
        // reaches the app. Retry the same Google sign-in in the current tab.
        try {
          await signInWithRedirect(firebaseAuth, new GoogleAuthProvider());
          return;
        } catch (redirectError) {
          onError(googleSignInErrorMessage(redirectError));
        }
      } else {
        onError(googleSignInErrorMessage(signInError));
      }
    } finally {
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
