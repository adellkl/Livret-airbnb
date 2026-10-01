'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Ban, Check, Search, ShieldAlert, Trash2, Users, type LucideIcon } from 'lucide-react';

import type { AdminProfile } from '@/hooks/useAdminData';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

type UserManagementDashboardProps = {
  profiles: AdminProfile[];
};

type AccountAction = 'suspend' | 'restore' | 'delete';

const displayName = (profile: AdminProfile) => profile.organizationName || profile.fullName || 'Compte sans nom';

function AccountStatus({ status }: { status?: string }) {
  if (status === 'suspended') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-light px-2.5 py-1 text-xs font-semibold text-amber-800"><Ban size={13} /> Suspendu</span>;
  }
  if (status === 'deleting') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive-light px-2.5 py-1 text-xs font-semibold text-destructive"><Trash2 size={13} /> Suppression à reprendre</span>;
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success"><Check size={13} /> Actif</span>;
}

export default function UserManagementDashboard({ profiles }: UserManagementDashboardProps) {
  const [search, setSearch] = useState('');
  const [deletionConfigured, setDeletionConfigured] = useState<boolean | null>(null);
  const [action, setAction] = useState<{ type: AccountAction; profile: AdminProfile } | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const owners = useMemo(() => profiles.filter((profile) => profile.role === 'owner'), [profiles]);
  const visibleOwners = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr-FR');
    return owners.filter((profile) => `${profile.fullName ?? ''} ${profile.organizationName ?? ''} ${profile.email ?? ''}`.toLocaleLowerCase('fr-FR').includes(query));
  }, [owners, search]);

  useEffect(() => {
    let active = true;
    void fetch('/api/admin/users', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result: { hardDeleteConfigured?: boolean }) => {
        if (active) setDeletionConfigured(result.hardDeleteConfigured === true);
      })
      .catch(() => {
        if (active) setDeletionConfigured(false);
      });
    return () => { active = false; };
  }, []);

  const closeAction = () => {
    if (isSaving) return;
    setAction(null);
    setConfirmationEmail('');
    setError('');
  };

  const runAction = async () => {
    if (!action) return;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      if (action.type === 'delete') {
        const user = firebaseAuth.currentUser;
        if (!user) throw new Error('Votre session admin a expiré. Reconnectez-vous et réessayez.');
        const idToken = await user.getIdToken();
        const response = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uid: action.profile.id, confirmationEmail }),
        });
        const result = await response.json().catch(() => ({})) as { error?: string; deletedProperties?: number };
        if (!response.ok) throw new Error(result.error || 'Impossible de supprimer ce compte.');
        setNotice(`Le compte ${action.profile.email || displayName(action.profile)} et ${result.deletedProperties ?? 0} logement(s) associé(s) ont été supprimés.`);
      } else {
        await updateDoc(doc(firestore, 'profiles', action.profile.id), {
          accountStatus: action.type === 'suspend' ? 'suspended' : 'active',
          updatedAt: serverTimestamp(),
        });
        setNotice(action.type === 'suspend'
          ? `Le compte de ${displayName(action.profile)} est suspendu. Il pourra être réactivé depuis cette page.`
          : `Le compte de ${displayName(action.profile)} est réactivé.`);
      }
      setAction(null);
      setConfirmationEmail('');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Une erreur est survenue. Réessayez.');
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedEmail = action?.profile.email?.trim().toLocaleLowerCase('fr-FR') ?? '';
  const emailMatches = confirmationEmail.trim().toLocaleLowerCase('fr-FR') === normalizedEmail;

  return (
    <div className="space-y-6">
      {notice && <p role="status" className="rounded-xl border border-success/20 bg-success-light px-4 py-3 text-sm font-medium text-success">{notice}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Comptes propriétaires" value={owners.length} icon={Users} />
        <Summary label="Comptes actifs" value={owners.filter((profile) => (profile.accountStatus ?? 'active') === 'active').length} icon={Check} />
        <Summary label="Comptes suspendus" value={owners.filter((profile) => profile.accountStatus === 'suspended').length} icon={ShieldAlert} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">Utilisateurs</h2>
            <p className="mt-1 text-sm text-muted-foreground">Suspendez, réactivez ou supprimez un compte propriétaire.</p>
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un compte" aria-label="Rechercher un compte" className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary sm:w-64" />
          </label>
        </div>

        {deletionConfigured === false && (
          <div className="flex gap-3 border-b border-warning/30 bg-warning-light/45 px-5 py-3.5 text-sm text-foreground sm:px-6">
            <ShieldAlert className="mt-0.5 shrink-0 text-amber-700" size={17} />
            <p className="leading-5">La suppression définitive est désactivée tant que les identifiants Firebase Admin ne sont pas configurés côté serveur. La suspension reste disponible.</p>
          </div>
        )}

        {visibleOwners.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[870px] text-left text-sm">
              <thead className="bg-surface-soft text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Compte</th>
                  <th className="px-5 py-3.5 font-semibold">Formule</th>
                  <th className="px-5 py-3.5 font-semibold">État</th>
                  <th className="px-5 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleOwners.map((profile) => {
                  const suspended = profile.accountStatus === 'suspended';
                  const deleting = profile.accountStatus === 'deleting';
                  return (
                    <tr key={profile.id} className="align-top transition hover:bg-surface-soft/60">
                      <td className="px-5 py-4 sm:px-6">
                        <p className="font-medium text-foreground">{displayName(profile)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{profile.email || 'E-mail non renseigné'}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">{profile.subscriptionPlan ? profile.subscriptionPlan[0].toUpperCase() + profile.subscriptionPlan.slice(1) : 'Gratuit'}</td>
                      <td className="px-5 py-4"><AccountStatus status={profile.accountStatus} /></td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {deleting ? (
                            <button type="button" disabled={deletionConfigured !== true} onClick={() => { setAction({ type: 'delete', profile }); setConfirmationEmail(''); setError(''); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={14} /> Reprendre la suppression</button>
                          ) : (
                            <button type="button" onClick={() => { setAction({ type: suspended ? 'restore' : 'suspend', profile }); setError(''); }} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${suspended ? 'border-success/25 text-success hover:bg-success-light' : 'border-warning/35 text-amber-800 hover:bg-warning-light'}`}>
                              {suspended ? <Check size={14} /> : <Ban size={14} />}{suspended ? 'Réactiver' : 'Suspendre'}
                            </button>
                          )}
                          {!deleting && (
                            <button type="button" disabled={deletionConfigured !== true || !profile.email || profile.id === firebaseAuth.currentUser?.uid} title={deletionConfigured === false ? 'Configurez Firebase Admin côté serveur pour activer la suppression.' : 'Supprimer définitivement ce compte'} onClick={() => { setAction({ type: 'delete', profile }); setConfirmationEmail(''); setError(''); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/25 px-3 text-xs font-semibold text-destructive transition hover:bg-destructive-light disabled:cursor-not-allowed disabled:opacity-45"><Trash2 size={14} /> Supprimer</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Users className="mx-auto text-muted-foreground/70" size={24} />
            <p className="mt-3 text-sm font-medium text-foreground">Aucun compte ne correspond</p>
            <p className="mt-1 text-sm text-muted-foreground">Modifiez votre recherche ou attendez la création des premiers comptes.</p>
          </div>
        )}
      </section>

      {action && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAction(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="user-action-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.type === 'delete' ? 'bg-destructive-light text-destructive' : action.type === 'suspend' ? 'bg-warning-light text-amber-800' : 'bg-success-light text-success'}`}>
              {action.type === 'delete' ? <Trash2 size={19} /> : action.type === 'suspend' ? <Ban size={19} /> : <Check size={19} />}
            </span>
            <h2 id="user-action-title" className="mt-4 text-xl font-semibold text-foreground">
              {action.type === 'delete' ? 'Supprimer définitivement ce compte ?' : action.type === 'suspend' ? 'Suspendre ce compte ?' : 'Réactiver ce compte ?'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{displayName(action.profile)} · {action.profile.email}</p>

            {action.type === 'delete' ? (
              <>
                <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive-light/50 p-4 text-sm leading-6 text-foreground">
                  Cette action est irréversible. Elle supprimera le compte Firebase, son profil, ses logements et les données associées : livrets, réservations, messages, avis et événements.
                </div>
                <label htmlFor="delete-user-confirmation" className="mt-4 block text-sm font-medium text-foreground">Retapez l’adresse e-mail pour confirmer</label>
                <input id="delete-user-confirmation" type="email" autoComplete="off" value={confirmationEmail} onChange={(event) => setConfirmationEmail(event.target.value)} placeholder={action.profile.email} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-destructive" />
              </>
            ) : (
              <p className="mt-4 rounded-xl bg-surface-soft p-4 text-sm leading-6 text-muted-foreground">
                {action.type === 'suspend'
                  ? 'Le compte sera déconnecté et ne pourra plus ouvrir son espace propriétaire ni accéder à ses données. Vous pourrez le réactiver plus tard.'
                  : 'Le compte pourra de nouveau se connecter et accéder à ses logements et livrets.'}
              </p>
            )}

            {error && <p role="alert" className="mt-4 rounded-xl bg-destructive-light px-4 py-3 text-sm text-destructive">{error}</p>}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={isSaving} onClick={closeAction} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-surface-soft disabled:opacity-60">Annuler</button>
              <button
                type="button"
                disabled={isSaving || (action.type === 'delete' && (!emailMatches || deletionConfigured !== true))}
                onClick={() => void runAction()}
                className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${action.type === 'delete' || action.type === 'suspend' ? 'bg-destructive hover:opacity-90' : 'bg-success hover:opacity-90'}`}
              >
                {isSaving ? 'Traitement…' : action.type === 'delete' ? 'Supprimer définitivement' : action.type === 'suspend' ? 'Suspendre le compte' : 'Réactiver le compte'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <Icon className="mb-4 text-primary" size={20} />
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </article>
  );
}
