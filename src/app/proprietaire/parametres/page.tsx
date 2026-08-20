'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Save, Settings2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { ROUTES } from '@/config/routes';
import { useSubscription } from '@/hooks/useSubscription';

export default function SettingsPage() {
  const [name, setName] = useState(''); const [organization, setOrganization] = useState(''); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false);
  const { plan, isPaid, isLoading } = useSubscription();
  useEffect(() => { const stop = onAuthStateChanged(firebaseAuth, async (user) => { if (!user) return; const profile = await getDoc(doc(firestore, 'profiles', user.uid)); const data = profile.data(); setName(String(data?.fullName ?? user.displayName ?? '')); setOrganization(String(data?.organizationName ?? '')); }); return stop; }, []);
  const save = async () => { const user = firebaseAuth.currentUser; if (!user) return; setSaving(true); setMessage(''); try { await updateDoc(doc(firestore, 'profiles', user.uid), { fullName: name.trim(), organizationName: organization.trim(), updatedAt: serverTimestamp() }); setMessage('Modifications enregistrées.'); } catch { setMessage('Impossible d’enregistrer les modifications.'); } finally { setSaving(false); } };
  return <OwnerPageShell title="Réglages" subtitle="Personnalisez les informations de votre compte propriétaire.">
    <section className="mb-6 max-w-2xl overflow-hidden rounded-[2rem] border border-[#e4ddd6] bg-[#17232c] p-6 text-white sm:p-7">
      <div className="flex items-start justify-between gap-5"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#ef9a78]"><Crown className="h-3.5 w-3.5" /> Votre abonnement</p><h2 className="mt-3 text-2xl font-semibold">{isLoading ? 'Chargement…' : isPaid ? `Formule ${plan === 'business' ? 'Business' : 'Pro'}` : 'Formule gratuite'}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-white/65">{isPaid ? 'Tous les espaces et fonctionnalités sont accessibles pour vos logements.' : 'Vous pouvez créer un logement et partager son guide avec un QR code. Les statistiques et intégrations sont réservées à Pro.'}</p></div>{isPaid ? <span className="rounded-full bg-[#367566] px-3 py-1.5 text-xs font-bold">Actif</span> : null}</div>
      {!isLoading && !isPaid && <Link href={ROUTES.PRICING} className="mt-5 inline-flex rounded-xl bg-[#e7754d] px-4 py-2.5 text-sm font-semibold text-white">Passer à Pro</Link>}
    </section>
    <section className="max-w-2xl rounded-[2rem] border border-[#e4ddd6] bg-white p-6 sm:p-8"><Settings2 className="text-[#d85b24]" /><h2 className="mt-5 text-xl font-semibold">Profil propriétaire</h2><div className="mt-6 space-y-4"><div><Label htmlFor="name">Nom complet</Label><Input id="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11" /></div><div><Label htmlFor="organization">Établissement</Label><Input id="organization" value={organization} onChange={(event) => setOrganization(event.target.value)} className="mt-2 h-11" /></div><Button onClick={save} disabled={saving} className="mt-2 rounded-xl bg-[#17232c]"><Save className="mr-2 h-4 w-4" />{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>{message && <p className="text-sm text-[#286454]">{message}</p>}</div></section>
  </OwnerPageShell>;
}
