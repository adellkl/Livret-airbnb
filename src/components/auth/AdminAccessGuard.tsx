'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

type AccessState = 'checking' | 'allowed' | 'error';

export default function AdminAccessGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [accessState, setAccessState] = useState<AccessState>('checking');

  useEffect(() => {
    let active = true;
    let stopProfile: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopProfile?.();
      setAccessState('checking');

      if (!user) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      stopProfile = onSnapshot(doc(firestore, 'profiles', user.uid), (profile) => {
        if (!active) return;
        const data = profile.data();
        const role = data?.role;
        if (data?.accountStatus === 'suspended' || data?.accountStatus === 'deleting') {
          setAccessState('checking');
          void signOut(firebaseAuth).finally(() => router.replace(ROUTES.LOGIN));
          return;
        }
        if (role === 'admin') {
          setAccessState('allowed');
          return;
        }

        setAccessState('checking');
        router.replace(role === 'owner' ? ROUTES.OWNER_DASHBOARD : ROUTES.LOGIN);
      }, () => {
        if (active) setAccessState('error');
      });
    }, () => {
      if (active) setAccessState('error');
    });

    return () => {
      active = false;
      stopProfile?.();
      stopAuth();
    };
  }, [router]);

  if (accessState === 'allowed') return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-8 shadow-premium">
        <h1 className="text-xl font-semibold text-foreground">Vérification de l’accès administrateur</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {accessState === 'error'
            ? 'Impossible de confirmer vos droits administrateur. Les données restent protégées; vérifiez votre connexion puis rechargez cette page.'
            : 'Vérification de votre compte…'}
        </p>
        {accessState === 'error' && <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Réessayer</button>}
      </div>
    </main>
  );
}
