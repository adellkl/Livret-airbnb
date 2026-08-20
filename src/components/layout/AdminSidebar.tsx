'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { ROUTES } from '@/config/routes';
import { firebaseAuth } from '@/lib/firebase/client';
import {
  Users,
  Building2,
  Shield,
  MessageSquare,
  CreditCard,
  FileText,
  Activity,
  Settings,
  ChevronRight,
  HelpCircle,
  LogOut,
} from 'lucide-react';

const menuSections = [
  {
    title: 'Gestion des comptes',
    items: [
      { icon: Users, label: 'Utilisateurs', href: ROUTES.ADMIN_USERS },
      { icon: Building2, label: 'Organisations', href: ROUTES.ADMIN_ORGANIZATIONS },
      { icon: Shield, label: 'Rôles et permissions', href: ROUTES.ADMIN_ROLES },
    ],
  },
  {
    title: 'Support et abonnements',
    items: [
      { icon: MessageSquare, label: 'Demandes d’assistance', href: ROUTES.ADMIN_SUPPORT },
      { icon: CreditCard, label: 'Abonnements', href: ROUTES.ADMIN_SUBSCRIPTIONS },
      { icon: FileText, label: 'Facturation', href: ROUTES.ADMIN_BILLING },
    ],
  },
  {
    title: 'Suivi et analyses',
    items: [
      { icon: Activity, label: 'Activité', href: ROUTES.ADMIN_DASHBOARD },
      { icon: FileText, label: 'Rapports', href: ROUTES.ADMIN_REPORTS },
      { icon: Shield, label: 'Audit logs', href: ROUTES.ADMIN_AUDIT },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { icon: Settings, label: 'Paramètres généraux', href: ROUTES.ADMIN_SETTINGS },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(firebaseAuth);
      router.replace(ROUTES.LOGIN);
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[250px] bg-surface border-r border-border flex flex-col z-50">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-lg font-semibold text-foreground">livret d&apos;accueil</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Espace administrateur</p>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-muted-foreground hover:bg-surface-soft hover:text-foreground'
                      }`}
                  >
                    <item.icon size={20} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Link href={ROUTES.ADMIN_SUPPORT} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-surface-soft hover:text-foreground transition-colors">
          <HelpCircle size={20} />
          <span className="text-sm font-medium">Centre d&apos;aide</span>
        </Link>
        <div className="flex items-center justify-between px-4 py-2 mt-2">
          <div>
            <p className="text-sm font-medium text-foreground">Administrateur</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
          <div className="flex items-center gap-1">
            <ChevronRight size={16} className="text-muted-foreground" />
            <button
              type="button"
              aria-label="Se déconnecter"
              title="Se déconnecter"
              disabled={isSigningOut}
              onClick={() => { void handleSignOut(); }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-danger-light hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
