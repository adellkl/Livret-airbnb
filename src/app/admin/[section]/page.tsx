'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Activity,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileBarChart,
  Home,
  LifeBuoy,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

import AdminSidebar from '@/components/layout/AdminSidebar';
import { Badge } from '@/components/ui/badge';
import { type AdminGuideEvent, useAdminData } from '@/hooks/useAdminData';

const pageMeta = {
  utilisateurs: { title: 'Utilisateurs', description: 'Tous les comptes présents sur la plateforme.', icon: Users },
  organisations: { title: 'Organisations', description: 'Les structures et leurs logements associés.', icon: Building2 },
  roles: { title: 'Rôles et permissions', description: 'Répartition des droits des comptes actifs.', icon: Shield },
  support: { title: 'Demandes d’assistance', description: 'Suivi des interactions et de l’activité récente.', icon: LifeBuoy },
  abonnements: { title: 'Abonnements', description: 'Plans souscrits et état des abonnements.', icon: CreditCard },
  facturation: { title: 'Facturation', description: 'Vue de suivi basée sur les abonnements actifs.', icon: CircleDollarSign },
  rapports: { title: 'Rapports', description: 'Indicateurs live de la plateforme.', icon: FileBarChart },
  audit: { title: 'Journal d’audit', description: 'Événements enregistrés dans les livrets publics.', icon: ClipboardList },
  parametres: { title: 'Paramètres généraux', description: 'État actuel des données de la plateforme.', icon: Settings },
} as const;

type Section = keyof typeof pageMeta;

function asText(value: unknown, fallback = '—') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function dateLabel(event: AdminGuideEvent) {
  const date = event.occurredAt?.toDate?.();
  return date ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'En attente';
}

function StatusBadge({ value }: { value?: string }) {
  const active = value === 'active' || value === 'published' || value === 'pro';
  return <Badge className={active ? 'bg-success-light text-success' : 'bg-surface-soft text-muted-foreground'}>{asText(value, 'Non renseigné')}</Badge>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <Icon className="mb-4 text-primary" size={22} />
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center text-sm text-muted-foreground">{message}</div>;
}

export default function AdminSectionPage() {
  const { section: routeSection } = useParams<{ section: string }>();
  const section = (routeSection in pageMeta ? routeSection : 'utilisateurs') as Section;
  const meta = pageMeta[section];
  const data = useAdminData();

  const owners = useMemo(() => data.profiles.filter((profile) => profile.role === 'owner'), [data.profiles]);
  const organizations = useMemo(() => owners.map((profile) => ({
    ...profile,
    properties: data.properties.filter((property) => property.ownerId === profile.id),
  })), [data.properties, owners]);
  const published = data.properties.filter((property) => property.status === 'published').length;
  const paidProfiles = data.profiles.filter((profile) => ['pro', 'business'].includes(profile.subscriptionPlan ?? ''));

  const content = () => {
    if (data.isLoading) return <Empty message="Chargement des données en direct…" />;
    if (data.error) return <Empty message={data.error} />;

    if (section === 'utilisateurs') return data.profiles.length ? (
      <Table headers={['Utilisateur', 'E-mail', 'Rôle', 'Formule']}>
        {data.profiles.map((profile) => <tr key={profile.id}><Cell>{asText(profile.fullName, 'Compte sans nom')}</Cell><Cell>{asText(profile.email)}</Cell><Cell><StatusBadge value={profile.role} /></Cell><Cell>{asText(profile.subscriptionPlan, 'free')}</Cell></tr>)}
      </Table>
    ) : <Empty message="Aucun utilisateur n’est encore enregistré." />;

    if (section === 'organisations') return organizations.length ? (
      <Table headers={['Organisation', 'Responsable', 'Logements', 'Statut']}>
        {organizations.map((organization) => <tr key={organization.id}><Cell>{asText(organization.organizationName, organization.fullName ?? 'Sans nom')}</Cell><Cell>{asText(organization.email)}</Cell><Cell>{organization.properties.length}</Cell><Cell><StatusBadge value={organization.subscriptionStatus} /></Cell></tr>)}
      </Table>
    ) : <Empty message="Les organisations apparaîtront ici lorsque des propriétaires créeront leur compte." />;

    if (section === 'roles') return (
      <div className="grid gap-4 md:grid-cols-3">
        {['admin', 'owner', 'traveler'].map((role) => <Metric key={role} label={`Comptes ${role === 'owner' ? 'propriétaires' : role}s`} value={data.profiles.filter((profile) => profile.role === role).length} icon={role === 'admin' ? Shield : Users} />)}
      </div>
    );

    if (section === 'support') return data.events.length ? (
      <Table headers={['Événement', 'Propriétaire', 'Date']}>
        {data.events.slice(0, 50).map((event) => <tr key={event.id}><Cell>{asText(event.eventType, 'Consultation du guide')}</Cell><Cell>{asText(data.profiles.find((profile) => profile.id === event.ownerId)?.fullName, 'Compte inconnu')}</Cell><Cell>{dateLabel(event)}</Cell></tr>)}
      </Table>
    ) : <Empty message="Aucune interaction à traiter pour le moment." />;

    if (section === 'abonnements' || section === 'facturation') return data.profiles.length ? (
      <Table headers={section === 'abonnements' ? ['Client', 'Formule', 'État', 'Logements'] : ['Client', 'Formule', 'État', 'Référence']}>
        {data.profiles.map((profile) => <tr key={profile.id}><Cell>{asText(profile.fullName, profile.email ?? 'Compte')}</Cell><Cell>{asText(profile.subscriptionPlan, 'free')}</Cell><Cell><StatusBadge value={profile.subscriptionStatus} /></Cell><Cell>{section === 'abonnements' ? data.properties.filter((property) => property.ownerId === profile.id).length : `Profil ${profile.id.slice(0, 8)}`}</Cell></tr>)}
      </Table>
    ) : <Empty message="Les informations de facturation apparaîtront après les premières inscriptions." />;

    if (section === 'rapports') return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Utilisateurs" value={data.profiles.length} icon={Users} /><Metric label="Logements" value={data.properties.length} icon={Home} /><Metric label="Livrets publiés" value={published} icon={CheckCircle2} /><Metric label="Événements guide" value={data.events.length} icon={Activity} /></div>;

    if (section === 'audit') return data.events.length ? (
      <Table headers={['Action', 'Propriétaire', 'Horodatage']}>
        {data.events.slice(0, 100).map((event) => <tr key={event.id}><Cell>{asText(event.eventType)}</Cell><Cell>{asText(event.ownerId)}</Cell><Cell>{dateLabel(event)}</Cell></tr>)}
      </Table>
    ) : <Empty message="Le journal affichera les événements au fur et à mesure de l’utilisation des guides." />;

    return <div className="grid gap-4 md:grid-cols-3"><Metric label="Comptes synchronisés" value={data.profiles.length} icon={Users} /><Metric label="Formules Pro et Business" value={paidProfiles.length} icon={CreditCard} /><Metric label="Logements enregistrés" value={data.properties.length} icon={Home} /></div>;
  };

  const Icon = meta.icon;
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="ml-[250px] min-h-screen">
        <header className="border-b border-border bg-surface px-8 py-6">
          <div className="flex items-start gap-4"><div className="rounded-xl bg-primary-light p-3 text-primary"><Icon size={24} /></div><div><h1 className="text-2xl font-semibold text-foreground">{meta.title}</h1><p className="mt-1 text-sm text-muted-foreground">{meta.description}</p></div></div>
        </header>
        <section className="mx-auto max-w-7xl p-8">{content()}</section>
      </main>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-surface-soft text-xs uppercase tracking-wide text-muted-foreground"><tr>{headers.map((header) => <th key={header} className="px-5 py-4 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-border">{children}</tbody></table></div></div>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="px-5 py-4 text-foreground">{children}</td>;
}
