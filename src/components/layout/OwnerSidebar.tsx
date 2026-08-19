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
import { createClient } from '@/lib/supabase/client';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', href: ROUTES.OWNER_DASHBOARD },
  { icon: Home, label: 'Logements', href: ROUTES.OWNER_PROPERTIES },
  { icon: BookOpen, label: 'Livrets', href: ROUTES.OWNER_PROPERTIES },
  { icon: Calendar, label: 'Réservations', href: ROUTES.OWNER_DASHBOARD },
  { icon: BarChart3, label: 'Statistiques', href: ROUTES.OWNER_STATISTICS },
  { icon: Users, label: 'Voyageurs', href: ROUTES.OWNER_TRAVELERS },
  { icon: Puzzle, label: 'Intégrations', href: ROUTES.OWNER_DASHBOARD },
  { icon: Settings, label: 'Réglages', href: ROUTES.OWNER_SETTINGS },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const [profileName, setProfileName] = useState('Mon compte');

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, organization_name').eq('id', user.id).maybeSingle();
      if (active) setProfileName(data?.organization_name || data?.full_name || user.email || 'Mon compte');
    };
    void loadProfile();
    return () => { active = false; };
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
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
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
        <div className="bg-sidebar-accent rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Crown size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1">Passez à la version Pro</h4>
              <p className="text-xs text-sidebar-foreground/60 mb-3">Débloquez des fonctionnalités avancées</p>
              <button className="w-full px-3 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg transition-colors">
                Découvrir nos offres
              </button>
            </div>
          </div>
        </div>

        <Link href="#" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors">
          <HelpCircle size={20} />
          <span className="text-sm font-medium">Besoin d&apos;aide ?</span>
        </Link>

        <div className="border-t border-sidebar-border pt-4">
          <div className="flex items-center justify-between px-4 py-2">
            <div>
              <p className="max-w-36 truncate text-sm font-medium">{profileName}</p>
              <p className="text-xs text-sidebar-foreground/60">Propriétaire</p>
            </div>
            <ChevronRight size={16} className="text-sidebar-foreground/60" />
          </div>
        </div>
      </div>
    </aside>
  );
}
