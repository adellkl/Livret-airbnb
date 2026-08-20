'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/config/routes';
import {
  LayoutDashboard,
  Home,
  BookOpen,
  Calendar,
  BarChart3,
  Users,
  Puzzle,
  Settings,
  ChevronRight,
  HelpCircle,
  Crown
} from 'lucide-react';
import BrandMark from '@/components/layout/BrandMark';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useSubscription } from '@/hooks/useSubscription';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', href: ROUTES.OWNER_DASHBOARD },
  { icon: Home, label: 'Logements', href: ROUTES.OWNER_PROPERTIES },
  { icon: BookOpen, label: 'Livrets', href: ROUTES.OWNER_BOOKLETS },
  { icon: Calendar, label: 'Réservations', href: ROUTES.OWNER_RESERVATIONS },
  { icon: BarChart3, label: 'Statistiques', href: ROUTES.OWNER_STATISTICS, proOnly: true },
  { icon: Users, label: 'Voyageurs', href: ROUTES.OWNER_TRAVELERS },
  { icon: Puzzle, label: 'Intégrations', href: ROUTES.OWNER_INTEGRATIONS, proOnly: true },
  { icon: Settings, label: 'Réglages', href: ROUTES.OWNER_SETTINGS },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const [profileName, setProfileName] = useState('Mon compte');
  const { isPaid, plan } = useSubscription();

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const user = firebaseAuth.currentUser;
      if (!user) return;
      const profile = await getDoc(doc(firestore, 'profiles', user.uid));
      const data = profile.data();
      if (active) setProfileName(data?.fullName || data?.organizationName || user.email || 'Mon compte');
    };
    const unsubscribe = onAuthStateChanged(firebaseAuth, () => { void loadProfile(); });
    return () => { active = false; unsubscribe(); };
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[250px] flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <BrandMark className="h-8 w-8" />
          <span className="text-lg font-semibold">livret d&apos;accueil</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.filter((item) => !item.proOnly || isPaid).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === ROUTES.OWNER_PROPERTIES && pathname.startsWith(`${ROUTES.OWNER_PROPERTIES}/`)) ||
            (item.href === ROUTES.OWNER_BOOKLETS && pathname.startsWith(`${ROUTES.OWNER_BOOKLETS}/`));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground'
                }`}
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-4">
        <Link href="#" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors">
          <HelpCircle size={20} />
          <span className="text-sm font-medium">Besoin d&apos;aide ?</span>
        </Link>

        <div className="border-t border-sidebar-border pt-4">
          <div className="flex items-center justify-between gap-2 px-4 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2"><p className="max-w-28 truncate text-sm font-medium">{profileName}</p><span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] ${isPaid ? 'border-[#8cc9b8]/25 bg-[#367566]/20 text-[#9ed6c7]' : 'border-white/15 bg-white/8 text-white/60'}`}>{isPaid && <Crown size={10} />}{isPaid ? (plan === 'business' ? 'Business' : 'Pro') : 'Gratuit'}</span></div>
              <p className="text-xs text-sidebar-foreground/60">{isPaid ? 'Propriétaire' : '1 logement inclus'}</p>
            </div>
            <ChevronRight size={16} className="text-sidebar-foreground/60" />
          </div>
        </div>
      </div>
    </aside>
  );
}
