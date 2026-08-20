'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, User, ChevronDown, LogOut, Building2, X } from 'lucide-react';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { ROUTES } from '@/config/routes';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const router = useRouter();
  const [profileName, setProfileName] = useState('Mon compte');
  const [email, setEmail] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const user = firebaseAuth.currentUser;
      if (!user) return;
      if (active) setEmail(user.email ?? '');
      const profile = await getDoc(doc(firestore, 'profiles', user.uid));
      const data = profile.data();
      if (active) setProfileName(data?.fullName || data?.organizationName || user.email || 'Mon compte');
    };
    const unsubscribe = onAuthStateChanged(firebaseAuth, () => { void loadProfile(); });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setAccountOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const signOut = async () => {
    setIsSigningOut(true);
    await firebaseSignOut(firebaseAuth);
    router.replace(ROUTES.LOGIN);
    router.refresh();
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-border bg-[#fbfaf8] px-4 py-4 shadow-[0_8px_30px_rgba(31,27,24,.06)] sm:px-8 sm:py-5">
      <div className="mx-auto flex max-w-[1440px] items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="relative flex shrink-0 items-center gap-1 sm:gap-4">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => { setNotificationsOpen((open) => !open); setAccountOpen(false); }}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-surface-soft hover:text-foreground"
          >
            <Bell size={19} />
          </button>
          <button
            type="button"
            aria-expanded={accountOpen}
            onClick={() => { setAccountOpen((open) => !open); setNotificationsOpen(false); }}
            className="flex items-center gap-2 border-l border-border pl-2 text-left sm:gap-3 sm:pl-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light">
              <User size={19} className="text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="max-w-44 truncate text-sm font-medium text-foreground">{profileName}</p>
              <p className="text-xs text-muted-foreground">Propriétaire</p>
            </div>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>

          {notificationsOpen && (
            <section className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-border bg-white p-4 shadow-xl" aria-label="Notifications">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-foreground">Notifications</p>
                <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Fermer"><X size={16} /></button>
              </div>
              <p className="rounded-xl bg-surface-soft px-3 py-4 text-center text-sm text-muted-foreground">Vous n’avez aucune nouvelle notification.</p>
            </section>
          )}

          {accountOpen && (
            <section className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-border bg-white p-2 shadow-xl" aria-label="Menu du compte">
              <div className="border-b border-border px-3 py-3">
                <p className="truncate text-sm font-semibold text-foreground">{profileName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
              <button type="button" onClick={() => { setAccountOpen(false); router.push(ROUTES.OWNER_PROPERTIES); }} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-surface-soft">
                <Building2 size={16} /> Mes logements
              </button>
              <button type="button" disabled={isSigningOut} onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-danger hover:bg-danger-light disabled:opacity-60">
                <LogOut size={16} /> {isSigningOut ? 'Déconnexion…' : 'Se déconnecter'}
              </button>
            </section>
          )}
        </div>
      </div>
    </header>
  );
}
