'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  BadgeCheck,
  Building2,
  CircleAlert,
  CircleDollarSign,
  CreditCard,
  FileText,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { PLAN_MONTHLY_ESTIMATES } from '@/config/subscription-pricing';
import type { AdminProfile, AdminProperty } from '@/hooks/useAdminData';
import { firestore } from '@/lib/firebase/client';

type BillingDashboardProps = {
  profiles: AdminProfile[];
  properties: AdminProperty[];
};

const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const planLabels: Record<string, string> = {
  free: 'Gratuit',
  pro: 'Pro',
  business: 'Business',
};

function planName(plan?: string) {
  return planLabels[plan ?? 'free'] ?? 'Non renseigné';
}

function statusFor(profile: AdminProfile) {
  const plan = profile.subscriptionPlan ?? 'free';
  if (plan === 'free') return { label: 'Sans frais', tone: 'bg-surface-soft text-muted-foreground' };

  switch (profile.subscriptionStatus) {
    case 'active':
      return { label: 'Actif', tone: 'bg-success-light text-success' };
    case 'trial':
    case 'trialing':
      return { label: 'Essai', tone: 'bg-blue-50 text-blue-700' };
    case 'past_due':
    case 'incomplete':
      return { label: 'À régulariser', tone: 'bg-warning-light text-amber-800' };
    case 'canceled':
    case 'cancelled':
      return { label: 'Résilié', tone: 'bg-destructive-light text-destructive' };
    default:
      return { label: 'À vérifier', tone: 'bg-surface-soft text-muted-foreground' };
  }
}

function SummaryCard({
  label,
  value,
  note,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${accent ? 'border-primary/15 bg-primary-light/45' : 'border-border bg-surface'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-primary text-white' : 'bg-surface-soft text-primary'}`}>
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{note}</p>
    </article>
  );
}

export default function BillingDashboard({ profiles, properties }: BillingDashboardProps) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [editingProfile, setEditingProfile] = useState<AdminProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planError, setPlanError] = useState('');
  const [planSaved, setPlanSaved] = useState('');

  const customers = useMemo(
    () => profiles.filter((profile) => profile.role === 'owner'),
    [profiles],
  );
  const activePaid = customers.filter(
    (profile) =>
      (profile.subscriptionPlan === 'pro' || profile.subscriptionPlan === 'business')
      && profile.subscriptionStatus === 'active',
  );
  const monthlyEstimate = activePaid.reduce((total, profile) => {
    const plan = profile.subscriptionPlan as keyof typeof PLAN_MONTHLY_ESTIMATES;
    return total + (PLAN_MONTHLY_ESTIMATES[plan] ?? 0);
  }, 0);

  const planBreakdown = [
    { key: 'free', label: 'Gratuit', count: customers.filter((profile) => !profile.subscriptionPlan || profile.subscriptionPlan === 'free').length, amount: 0, color: 'bg-[#95a39b]' },
    { key: 'pro', label: 'Pro', count: customers.filter((profile) => profile.subscriptionPlan === 'pro').length, amount: PLAN_MONTHLY_ESTIMATES.pro, color: 'bg-primary' },
    { key: 'business', label: 'Business', count: customers.filter((profile) => profile.subscriptionPlan === 'business').length, amount: PLAN_MONTHLY_ESTIMATES.business, color: 'bg-[#1d3446]' },
  ];

  const visibleCustomers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr-FR');
    return customers.filter((profile) => {
      const matchesPlan = planFilter === 'all' || (profile.subscriptionPlan ?? 'free') === planFilter;
      const haystack = `${profile.organizationName ?? ''} ${profile.fullName ?? ''} ${profile.email ?? ''}`.toLocaleLowerCase('fr-FR');
      return matchesPlan && (!query || haystack.includes(query));
    });
  }, [customers, planFilter, search]);

  const beginPlanChange = (profile: AdminProfile) => {
    setEditingProfile(profile);
    setSelectedPlan(profile.subscriptionPlan ?? 'free');
    setPlanError('');
    setPlanSaved('');
  };

  const savePlanChange = async () => {
    if (!editingProfile || selectedPlan === (editingProfile.subscriptionPlan ?? 'free')) return;
    setIsSavingPlan(true);
    setPlanError('');
    try {
      await updateDoc(doc(firestore, 'profiles', editingProfile.id), {
        subscriptionPlan: selectedPlan,
        subscriptionStatus: 'active',
        updatedAt: serverTimestamp(),
      });
      setPlanSaved(`La formule de ${editingProfile.fullName || editingProfile.email || 'ce client'} a été modifiée.`);
      setEditingProfile(null);
    } catch {
      setPlanError('Impossible d’enregistrer la formule. Vérifiez votre rôle admin et réessayez.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {planSaved && <p role="status" className="rounded-xl border border-success/20 bg-success-light px-4 py-3 text-sm font-medium text-success">{planSaved}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Revenu mensuel estimé"
          value={money.format(monthlyEstimate)}
          note="Tarif annuel mensualisé, hors taxes"
          icon={CircleDollarSign}
          accent
        />
        <SummaryCard
          label="Abonnements payants actifs"
          value={String(activePaid.length)}
          note="Comptes Pro et Business marqués actifs"
          icon={BadgeCheck}
        />
        <SummaryCard
          label="Clients suivis"
          value={String(customers.length)}
          note="Profils propriétaires synchronisés"
          icon={Users}
        />
        <SummaryCard
          label="Logements associés"
          value={String(properties.filter((property) => customers.some((profile) => profile.id === property.ownerId)).length)}
          note="Logements reliés aux profils propriétaires"
          icon={Building2}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.65fr_1.35fr]">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Répartition des formules</h2>
              <p className="mt-1 text-sm text-muted-foreground">Comptes propriétaires regroupés par offre</p>
            </div>
            <CreditCard className="text-primary" size={20} />
          </div>

          <div className="mt-6 space-y-5">
            {planBreakdown.map((plan) => {
              const share = customers.length ? Math.round((plan.count / customers.length) * 100) : 0;
              return (
                <div key={plan.key}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{plan.label}</span>
                    <span className="text-muted-foreground">{plan.count} compte{plan.count > 1 ? 's' : ''} · {share}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
                    <div className={`h-full rounded-full ${plan.color}`} style={{ width: `${share}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {plan.amount ? `${money.format(plan.amount)} / mois estimés par compte` : 'Aucun revenu récurrent estimé'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Comptes et abonnements</h2>
              <p className="mt-1 text-sm text-muted-foreground">Données mises à jour en direct depuis les profils</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un client"
                  aria-label="Rechercher un client"
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary sm:w-52"
                />
              </label>
              <label className="sr-only" htmlFor="billing-plan-filter">Filtrer par formule</label>
              <select
                id="billing-plan-filter"
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                <option value="all">Toutes les formules</option>
                <option value="free">Gratuit</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          {visibleCustomers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-surface-soft text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold sm:px-6">Client</th>
                    <th className="px-5 py-3.5 font-semibold">Formule</th>
                    <th className="px-5 py-3.5 font-semibold">État</th>
                    <th className="px-5 py-3.5 font-semibold">Logements</th>
                    <th className="px-5 py-3.5 font-semibold">Estimé / mois</th>
                    <th className="px-5 py-3.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleCustomers.map((profile) => {
                    const status = statusFor(profile);
                    const plan = profile.subscriptionPlan ?? 'free';
                    const propertiesCount = properties.filter((property) => property.ownerId === profile.id).length;
                    const estimated = profile.subscriptionStatus === 'active'
                      ? PLAN_MONTHLY_ESTIMATES[plan as keyof typeof PLAN_MONTHLY_ESTIMATES] ?? 0
                      : 0;
                    return (
                      <tr key={profile.id} className="transition hover:bg-surface-soft/65">
                        <td className="px-5 py-4 sm:px-6">
                          <p className="font-medium text-foreground">{profile.organizationName || profile.fullName || 'Compte sans nom'}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{profile.email || 'E-mail non renseigné'}</p>
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground">{planName(plan)}</td>
                        <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.tone}`}>{status.label}</span></td>
                        <td className="px-5 py-4 text-muted-foreground">{propertiesCount}</td>
                        <td className="px-5 py-4 font-medium text-foreground">{money.format(estimated)}</td>
                        <td className="px-5 py-4">
                          <button type="button" onClick={() => beginPlanChange(profile)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary-light/50 hover:text-primary">
                            <ArrowUpDown size={14} /> Changer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto text-muted-foreground/70" size={24} />
              <p className="mt-3 text-sm font-medium text-foreground">Aucun compte ne correspond</p>
              <p className="mt-1 text-sm text-muted-foreground">Modifiez la recherche ou le filtre de formule.</p>
            </div>
          )}
        </section>
      </div>

      <aside className="flex gap-3 rounded-2xl border border-warning/30 bg-warning-light/55 p-4 text-sm text-foreground">
        <CircleAlert className="mt-0.5 shrink-0 text-amber-700" size={18} />
        <p className="leading-6">
          <span className="font-semibold">Estimations uniquement.</span> Les profils contiennent la formule et son statut, mais aucune facture ni aucun paiement encaissé n’est encore relié à la plateforme. Le cycle de facturation n’étant pas enregistré, le revenu est estimé au tarif annuel mensualisé affiché sur la page des offres.
        </p>
      </aside>

      {editingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSavingPlan) setEditingProfile(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="billing-plan-dialog-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Gestion de l’abonnement</p>
            <h2 id="billing-plan-dialog-title" className="mt-2 text-xl font-semibold text-foreground">Changer la formule</h2>
            <p className="mt-2 text-sm text-muted-foreground">{editingProfile.organizationName || editingProfile.fullName || 'Compte'} · {editingProfile.email || 'E-mail non renseigné'}</p>

            <label htmlFor="billing-plan-select" className="mt-6 block text-sm font-medium text-foreground">Nouvelle formule</label>
            <select id="billing-plan-select" value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary">
              <option value="free">Gratuit — 0 € / mois</option>
              <option value="pro">Pro — 39 € / mois (tarif annuel mensualisé)</option>
              <option value="business">Business — 79 € / mois (tarif annuel mensualisé)</option>
            </select>

            <p className="mt-4 rounded-xl bg-surface-soft px-4 py-3 text-xs leading-5 text-muted-foreground">
              Le changement s’applique immédiatement aux droits du compte et marque l’abonnement actif. Aucun paiement ni aucune facture ne seront créés automatiquement.
            </p>
            {planError && <p role="alert" className="mt-3 rounded-xl bg-destructive-light px-4 py-3 text-sm text-destructive">{planError}</p>}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={isSavingPlan} onClick={() => setEditingProfile(null)} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-surface-soft disabled:opacity-60">Annuler</button>
              <button type="button" disabled={isSavingPlan || selectedPlan === (editingProfile.subscriptionPlan ?? 'free')} onClick={() => void savePlanChange()} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-55">{isSavingPlan ? 'Enregistrement…' : 'Confirmer le changement'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
