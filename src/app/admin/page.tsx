'use client';

import { useEffect, useState } from 'react';

import AdminSidebar from '@/components/layout/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Building2,
  Home,
  MessageSquare,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Organization = {
  id: string;
  name: string;
  email: string;
  properties: number;
  lastConnection: string;
  status: string;
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ users: 0, organizations: 0, publishedProperties: 0 });
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const [{ data: profiles }, { data: properties }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, organization_name, created_at'),
        supabase.from('properties').select('owner_id, status'),
      ]);
      if (!active) return;
      const allProperties = properties ?? [];
      const allProfiles = profiles ?? [];
      setCounts({
        users: allProfiles.length,
        organizations: allProfiles.filter((profile) => profile.organization_name).length,
        publishedProperties: allProperties.filter((property) => property.status === 'published').length,
      });
      setOrganizations(allProfiles.map((profile) => ({
        id: profile.id,
        name: profile.organization_name || profile.full_name || 'Sans établissement',
        email: 'Adresse e-mail protégée',
        properties: allProperties.filter((property) => property.owner_id === profile.id).length,
        lastConnection: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(profile.created_at)),
        status: 'active',
      })));
    };
    void load();
    return () => { active = false; };
  }, []);

  const stats = [
    { icon: Users, label: 'Utilisateurs', value: String(counts.users), trend: 'En direct', trendUp: true },
    { icon: Building2, label: 'Organisations', value: String(counts.organizations), trend: 'En direct', trendUp: true },
    { icon: Home, label: 'Livrets publiés', value: String(counts.publishedProperties), trend: 'En direct', trendUp: true },
  ];

  const alerts = [
    { type: 'payment', message: '3 paiements échoués', count: 3 },
    { type: 'content', message: '5 contenus signalés', count: 5 },
    { type: 'validation', message: '2 organisations à valider', count: 2 }
  ];

  const recentActivity = [
    { action: 'Nouvelle inscription', entity: 'Conciergerie Lyon', time: 'Il y a 30min' },
    { action: 'Mise à jour plan', entity: 'HostnFly', time: 'Il y a 1h' },
    { action: 'Demande support', entity: 'GuestReady', time: 'Il y a 2h' },
    { action: 'Nouveau logement', entity: 'BNB Solutions', time: 'Il y a 3h' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success-light text-success">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-surface-soft text-muted-foreground">Inactif</Badge>;
      case 'suspended':
        return <Badge className="bg-danger-light text-danger">Suspendu</Badge>;
      default:
        return <Badge className="bg-surface-soft text-muted-foreground">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="lg:ml-[250px]">
        <div className="bg-surface border-b border-border px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Tableau de bord administrateur</h1>
              <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <TrendingUp size={16} className="mr-2" />
                Exporter rapport
              </Button>
            </div>
          </div>
        </div>

        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-surface rounded-xl p-6 shadow-premium">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary-light rounded-lg">
                    <stat.icon size={20} className="text-primary" />
                  </div>
                  <span className={`text-xs font-medium ${stat.trendUp ? 'text-success' : 'text-danger'}`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-surface rounded-xl shadow-premium overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Organisations récentes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-soft">
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Organisation</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-muted-foreground">Logements</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-muted-foreground">Dernière connexion</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-muted-foreground">Statut</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((org) => (
                      <tr key={org.id} className="border-b border-border last:border-b-0 hover:bg-surface-soft">
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-medium text-foreground">{org.name}</p>
                            <p className="text-xs text-muted-foreground">{org.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-foreground">{org.properties}</td>
                        <td className="py-4 px-6 text-center text-sm text-muted-foreground">{org.lastConnection}</td>
                        <td className="py-4 px-6 text-center">{getStatusBadge(org.status)}</td>
                        <td className="py-4 px-6 text-center">
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreVertical size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-surface rounded-xl p-6 shadow-premium">
                <h3 className="text-lg font-semibold text-foreground mb-4">Alertes et modération</h3>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface-soft rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={18} className="text-warning" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{alert.count} éléments</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-8">
                        Voir
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface rounded-xl p-6 shadow-premium">
                <h3 className="text-lg font-semibold text-foreground mb-4">Activité récente</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.entity} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-surface rounded-xl p-6 shadow-premium">
              <h3 className="text-lg font-semibold text-foreground mb-4">Statistiques de revenus</h3>
              <div className="h-64 bg-surface-soft rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <CreditCard size={48} className="text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Graphique des revenus mensuels</p>
                  <p className="text-xs text-muted-foreground mt-1">Mai 2025: 45 678 €</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-6 shadow-premium">
              <h3 className="text-lg font-semibold text-foreground mb-4">Distribution des plans</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-foreground">Starter</span>
                    <span className="text-sm text-muted-foreground">35%</span>
                  </div>
                  <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[35%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-foreground">Pro</span>
                    <span className="text-sm text-muted-foreground">45%</span>
                  </div>
                  <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[45%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-foreground">Business</span>
                    <span className="text-sm text-muted-foreground">20%</span>
                  </div>
                  <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[20%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
