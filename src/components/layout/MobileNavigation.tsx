'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  BookOpen,
  Calendar,
  CreditCard,
  Users,
  Settings,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Plus,
  X,
} from 'lucide-react';
import BrandMark from '@/components/layout/BrandMark';
import { ROUTES } from '@/config/routes';
import { useSubscription } from '@/hooks/useSubscription';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface MobileNavigationProps {
  type: 'owner' | 'admin';
}

const ownerMenuItems = [
  { label: 'Tableau de bord', href: ROUTES.OWNER_DASHBOARD, icon: LayoutDashboard },
  { label: 'Mes logements', href: ROUTES.OWNER_PROPERTIES, icon: Building2 },
  { label: 'Livrets', href: ROUTES.OWNER_BOOKLETS, icon: BookOpen },
  { label: 'Nouveau logement', href: ROUTES.OWNER_PROPERTY_NEW, icon: Plus },
  { label: 'Accès voyageurs', href: ROUTES.OWNER_RESERVATIONS, icon: Calendar },
  { label: 'Voyageurs', href: ROUTES.OWNER_TRAVELERS, icon: Users },
  { label: 'Abonnement', href: ROUTES.OWNER_SUBSCRIPTION, icon: CreditCard },
  { label: 'Réglages', href: ROUTES.OWNER_SETTINGS, icon: Settings },
];

const adminMenuItems = [
  { label: 'Administration', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
];

export default function MobileNavigation({ type }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileName, setProfileName] = useState('Mon compte');
  const [avatarUrl, setAvatarUrl] = useState('');
  const pathname = usePathname();
  const { isPaid, plan } = useSubscription();
  const menuItems = (type === 'owner' ? ownerMenuItems : adminMenuItems).filter(
    (item) => !('proOnly' in item) || !item.proOnly || isPaid,
  );

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const user = firebaseAuth.currentUser;
      if (!user) return;

      const profile = await getDoc(doc(firestore, 'profiles', user.uid));
      const data = profile.data();
      if (!active) return;

      setProfileName(data?.fullName || data?.organizationName || user.email || 'Mon compte');
      setAvatarUrl(typeof data?.avatarUrl === 'string' ? data.avatarUrl : '');
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, () => { void loadProfile(); });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? 'Fermer le menu propriétaire' : 'Ouvrir le menu propriétaire'}
        aria-expanded={isOpen}
        aria-controls="owner-mobile-menu"
        className="fixed right-4 top-3 z-[70] flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17232c] text-white shadow-[0_12px_28px_rgba(23,35,44,.24)] ring-1 ring-white/20 transition hover:bg-[#263942] active:scale-95 lg:hidden"
        onClick={() => setIsOpen((open) => !open)}
      >
        <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </motion.span>
      </button>

      <AnimatePresence>
      {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[60] overflow-hidden lg:hidden">
        <motion.button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-[#101713]/45 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.aside
          id="owner-mobile-menu"
          aria-label="Navigation propriétaire"
          className="absolute inset-y-0 right-0 flex w-[86%] max-w-[390px] flex-col overflow-hidden bg-[#f8f5f1] shadow-[-30px_0_80px_rgba(18,27,23,.25)]"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 310, damping: 31 }}
        >
          <div className="flex h-[76px] items-center gap-3 border-b border-[#ded8d1] px-6">
            <BrandMark className="h-9 w-9" />
            <div>
              <p className="font-serif text-lg font-semibold text-[#1f2925]">Espace propriétaire</p>
              <p className="text-[10px] uppercase tracking-[0.13em] text-[#8a837d]">
                Mon Livret
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <p className="px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#d96c4a]">
              Navigation
            </p>
            <div className="mt-3 space-y-1.5">
              {menuItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href === ROUTES.OWNER_PROPERTIES &&
                    pathname.startsWith(`${ROUTES.OWNER_PROPERTIES}/`)) ||
                  (item.href === ROUTES.OWNER_BOOKLETS &&
                    pathname.startsWith(`${ROUTES.OWNER_BOOKLETS}/`));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition ${
                      active
                        ? 'bg-[#17232c] text-white shadow-[0_10px_25px_rgba(23,35,44,.13)]'
                        : 'text-[#3d4541] hover:bg-white'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        active ? 'bg-white/10 text-[#ef8b64]' : 'bg-[#f0e7e0] text-[#d85b24]'
                      }`}
                    >
                      <item.icon size={18} />
                    </span>
                    <span className="flex-1 text-sm font-semibold">{item.label}</span>
                    <ArrowRight size={15} className={active ? 'text-white/50' : 'text-[#9b948e]'} />
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-[#ded8d1] bg-white/60 p-5">
            <Link
              href={ROUTES.OWNER_SETTINGS}
              onClick={() => setIsOpen(false)}
              className="mb-4 flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white"
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f4e7df] text-sm font-semibold text-[#d85b24]">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`Photo de ${profileName}`}
                    fill
                    sizes="44px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span aria-hidden="true">{profileName.trim().charAt(0).toLocaleUpperCase('fr-FR') || 'P'}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#27302c]">{profileName}</p>
                <p className="text-xs text-[#807a75]">Propriétaire · {isPaid ? `Formule ${plan === 'business' ? 'Business' : 'Pro'}` : 'Formule gratuite'}</p>
              </div>
            </Link>
            <Link
              href={ROUTES.HOME}
              onClick={() => setIsOpen(false)}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#ded8d1] bg-white text-xs font-semibold text-[#4d5651]"
            >
              Voir le site public
              <ExternalLink size={14} />
            </Link>
          </div>
        </motion.aside>
      </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
