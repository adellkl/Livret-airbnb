'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  MessageSquare,
  CreditCard,
  FileText,
  Activity,
  Settings,
  ChevronRight,
  HelpCircle
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
      { icon: MessageSquare, label: 'Demandes d&apos;assistance', href: ROUTES.ADMIN_SUPPORT },
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
        <Link href="#" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-surface-soft hover:text-foreground transition-colors">
          <HelpCircle size={20} />
          <span className="text-sm font-medium">Centre d&apos;aide</span>
        </Link>
        <div className="flex items-center justify-between px-4 py-2 mt-2">
          <div>
            <p className="text-sm font-medium text-foreground">Administrateur</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
}
