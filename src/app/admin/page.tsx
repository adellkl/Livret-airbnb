'use client';

import { useMemo } from 'react';

import AdminSidebar from '@/components/layout/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Building2,
  Home,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';

type Organization = {
  id: string;
  name: string;
  email: string;
  properties: number;
  lastConnection: string;
  status: string;
};

export default function AdminDashboard() {
  const { profiles, properties, events, isLoading, error } = useAdminData();
  const organizations = useMemo<Organization[]>(() => profiles
    .filter((profile) => profile.role === 'owner' || profile.role === 'admin')
    .map((profile) => ({
      id: profile.id,
      name: String(profile.organizationName || profile.fullName || 'Sans établissement'),
      email: String(profile.email || 'Adresse e-mail protégée'),
      properties: properties.filter((property) => property.ownerId === profile.id).length,
      lastConnection: 'Synchronisé en direct',
      status: profile.subscriptionStatus || 'active',
    })), [profiles, properties]);
  const counts = {
    users: profiles.length,
    organizations: organizations.length,
    publishedProperties: properties.filter((property) => property.status === 'published').length,
  };

  const stats = [
    { icon: Users, label: 'Utilisateurs', value: String(counts.users), trend: 'En direct', trendUp: true },
    { icon: Building2, label: 'Organisations', value: String(counts.organizations), trend: 'En direct', trendUp: true },
    { icon: Home, label: 'Livrets publiés', value: String(counts.publishedProperties), trend: 'En direct', trendUp: true },
  ];

  const alerts = [
    { type: 'published', message: 'livrets publiés', count: counts.publishedProperties },
    { type: 'events', message: 'événements de guide', count: events.length },
    { type: 'subscriptions', message: 'abonnements actifs', count: profiles.filter((profile) => profile.subscriptionStatus === 'active').length },
  ];

  const recentActivity = events.slice(0, 4).map((event) => ({
    action: event.eventType || 'Consultation du guide',
    entity: profiles.find((profile) => profile.id === event.ownerId)?.fullName || 'Propriétaire',
    time: event.occurredAt?.toDate?.() ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(event.occurredAt.toDate()) : 'À l’instant',
  }));
  const plans = ['free', 'pro', 'business'].map((plan) => {
    const count = profiles.filter((profile) => (profile.subscriptionPlan || 'free') === plan).length;
    return { label: plan === 'free' ? 'Starter' : plan[0].toUpperCase() + plan.slice(1), count, percentage: profiles.length ? Math.round((count / profiles.length) * 100) : 0 };
  });

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
              <p className="text-sm text-muted-foreground mt-1">Vue d’ensemble de la plateforme</p>
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
          {isLoading && <p className="mb-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">Synchronisation des données administrateur…</p>}
          {error && <p className="mb-6 rounded-lg border border-danger bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
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
                    {!isLoading && organizations.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Aucune organisation à afficher.</td></tr>}
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
                          <p className="text-sm font-medium text-foreground">{alert.count} {alert.message}</p>
                          <p className="text-xs text-muted-foreground">Donnée synchronisée</p>
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
                  {!isLoading && recentActivity.length === 0 && <p className="text-sm text-muted-foreground">Aucune activité enregistrée pour le moment.</p>}
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
                {plans.map((plan) => <div key={plan.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-foreground">{plan.label}</span>
                    <span className="text-sm text-muted-foreground">{plan.percentage}% ({plan.count})</span>
                  </div>
                  <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${plan.percentage}%` }}></div>
                  </div>
                </div>)}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
