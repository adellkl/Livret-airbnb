'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, Crown, LockKeyhole, Mail, Save, Settings2, Smartphone } from 'lucide-react';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { firebaseStorage } from '@/lib/firebase/client';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ROUTES } from '@/config/routes';
import { useSubscription } from '@/hooks/useSubscription';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { plan, isPaid, isLoading } = useSubscription();

  useEffect(() => {
    const stop = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) return;
      const profile = await getDoc(doc(firestore, 'profiles', user.uid));
      const data = profile.data();
      setName(String(data?.fullName ?? user.displayName ?? ''));
      setOrganization(String(data?.organizationName ?? ''));
      setContactEmail(String(data?.contactEmail ?? user.email ?? ''));
      setPhone(String(data?.phone ?? ''));
      setAvatarUrl(String(data?.avatarUrl ?? ''));
      setAccountEmail(user.email ?? '');
    });
    return stop;
  }, []);

  const save = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    setMessage('');
    setError('');
    if (!name.trim()) {
      setError('Votre nom est requis.');
      return;
    }
    if (contactEmail.trim() && !emailPattern.test(contactEmail.trim())) {
      setError('Saisissez une adresse e-mail de contact valide.');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phone.trim() && (phoneDigits.length < 8 || phoneDigits.length > 15 || !/^\+?[0-9\s().-]+$/.test(phone.trim()))) {
      setError('Saisissez un numéro de téléphone valide.');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(firestore, 'profiles', user.uid), {
        fullName: name.trim(), organizationName: organization.trim(), contactEmail: contactEmail.trim().toLowerCase(), phone: phone.trim(), updatedAt: serverTimestamp(),
      });
      setMessage('Modifications enregistrées.');
    } catch {
      setError('Impossible d’enregistrer les modifications.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!file) return;
    setMessage('');
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Choisissez un fichier image (JPG, PNG ou WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('L’image est trop volumineuse. La taille maximale est de 10 Mo.');
      return;
    }
    const user = firebaseAuth.currentUser;
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
      const avatarRef = ref(firebaseStorage, `properties/${user.uid}/profile/${crypto.randomUUID()}-${safeFileName}`);
      await uploadBytes(avatarRef, file, { contentType: file.type });
      const nextAvatarUrl = await getDownloadURL(avatarRef);
      await updateDoc(doc(firestore, 'profiles', user.uid), { avatarUrl: nextAvatarUrl, updatedAt: serverTimestamp() });
      setAvatarUrl(nextAvatarUrl);
      setMessage('Votre photo est enregistrée. Synchronisation de vos guides…');

      const properties = await getDocs(query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)));
      const synchronizations = await Promise.allSettled(properties.docs.map(async (propertyDocument) => {
        await updateDoc(propertyDocument.ref, { hostAvatarUrl: nextAvatarUrl, updatedAt: serverTimestamp() });
        const guideRef = doc(firestore, 'public_guides', propertyDocument.id);
        const guide = await getDoc(guideRef);
        if (guide.exists()) await updateDoc(guideRef, { hostAvatarUrl: nextAvatarUrl, updatedAt: serverTimestamp() });
      }));
      const failedSynchronizations = synchronizations.filter((result) => result.status === 'rejected').length;
      setMessage(failedSynchronizations
        ? 'Votre photo est enregistrée. Elle sera ajoutée aux anciens guides lors de leur prochaine mise à jour.'
        : 'Votre photo est enregistrée et affichée sur vos guides publiés.');
    } catch {
      setError('Impossible d’importer votre photo. Vérifiez votre connexion puis réessayez.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const resetPassword = async () => {
    const user = firebaseAuth.currentUser;
    if (!user?.email) return;
    setMessage(''); setError(''); setResettingPassword(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, user.email, { url: `${window.location.origin}${ROUTES.LOGIN}` });
      setMessage(`Un lien sécurisé a été envoyé à ${user.email}.`);
    } catch {
      setError('Impossible d’envoyer le lien de réinitialisation. Réessayez dans un instant.');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <OwnerPageShell title="Réglages" subtitle="Personnalisez les informations de votre compte propriétaire.">
      <section className="mb-6 max-w-2xl overflow-hidden rounded-[2rem] border border-[#e4ddd6] bg-[#17232c] p-6 text-white sm:p-7">
        <div className="flex items-start justify-between gap-5"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#ef9a78]"><Crown className="h-3.5 w-3.5" /> Votre abonnement</p><h2 className="mt-3 text-2xl font-semibold">{isLoading ? 'Chargement…' : isPaid ? `Formule ${plan === 'business' ? 'Business' : 'Pro'}` : 'Formule gratuite'}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-white/65">{isPaid ? 'Tous les espaces et fonctionnalités sont accessibles pour vos logements.' : 'Vous pouvez créer un logement et partager son guide avec un QR code. Les statistiques et intégrations sont réservées à Pro.'}</p></div>{isPaid ? <span className="rounded-full bg-[#367566] px-3 py-1.5 text-xs font-bold">Actif</span> : null}</div>
        {!isLoading && !isPaid && <Link href={ROUTES.PRICING} className="mt-5 inline-flex rounded-xl bg-[#e7754d] px-4 py-2.5 text-sm font-semibold text-white">Passer à Pro</Link>}
      </section>

      <section className="max-w-2xl rounded-[2rem] border border-[#e4ddd6] bg-white p-6 sm:p-8">
        <Settings2 className="text-[#d85b24]" /><h2 className="mt-5 text-xl font-semibold">Profil propriétaire</h2><p className="mt-1 text-sm text-[#77736f]">Ces coordonnées sont utilisées pour votre compte et vos échanges avec les voyageurs.</p>
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#eee8e2] bg-[#fcfaf8] p-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f4e5df] text-[#d85b24]">
            {avatarUrl ? <Image src={avatarUrl} alt="Votre photo de profil" fill unoptimized sizes="64px" className="object-cover" /> : <span className="text-xl font-semibold">{name.trim().slice(0, 1).toUpperCase() || 'P'}</span>}
          </div>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#2a3032]">Votre photo sur les guides</p><p className="mt-1 text-xs leading-5 text-[#77736f]">Elle sera visible par les voyageurs à côté de votre message d’accueil.</p></div>
          <Label htmlFor="avatar" className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[#17232c] px-3 py-2.5 text-xs font-semibold text-white"><Camera size={15} />{uploadingAvatar ? 'Import…' : 'Ajouter'}</Label>
          <Input id="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadAvatar} disabled={uploadingAvatar} className="sr-only" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label htmlFor="name">Nom complet *</Label><Input id="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-2 h-11" required /></div>
          <div><Label htmlFor="organization">Établissement</Label><Input id="organization" value={organization} onChange={(event) => setOrganization(event.target.value)} autoComplete="organization" className="mt-2 h-11" /></div>
          <div><Label htmlFor="phone">Téléphone de contact</Label><Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="06 12 34 56 78" autoComplete="tel" className="mt-2 h-11" /></div>
          <div className="sm:col-span-2"><Label htmlFor="contact-email">E-mail de contact</Label><Input id="contact-email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="vous@exemple.com" autoComplete="email" className="mt-2 h-11" /></div>
        </div>
        <Button onClick={save} disabled={saving} className="mt-6 rounded-xl bg-[#17232c]"><Save className="mr-2 h-4 w-4" />{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </section>

      <section className="mt-6 max-w-2xl rounded-[2rem] border border-[#e4ddd6] bg-white p-6 sm:p-8">
        <LockKeyhole className="text-[#d85b24]" /><h2 className="mt-5 text-xl font-semibold">Sécurité du compte</h2><p className="mt-1 text-sm text-[#77736f]">Gérez l’accès à votre espace propriétaire.</p>
        <div className="mt-6 rounded-2xl border border-[#eee8e2] bg-[#fcfaf8] p-4"><div className="flex items-start gap-3"><Mail className="mt-0.5 shrink-0 text-[#d85b24]" size={18} /><div><p className="text-sm font-semibold text-[#2a3032]">E-mail de connexion</p><p className="mt-1 text-sm text-[#77736f]">{accountEmail || 'Chargement…'}</p></div></div><p className="mt-4 border-t border-[#eee8e2] pt-4 text-sm text-[#77736f]">Pour modifier cette adresse, contactez le support afin de préserver la sécurité de votre compte.</p></div>
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#eee8e2] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Smartphone className="mt-0.5 shrink-0 text-[#d85b24]" size={18} /><div><p className="text-sm font-semibold text-[#2a3032]">Mot de passe</p><p className="mt-1 text-sm text-[#77736f]">Recevez un lien sécurisé pour le modifier.</p></div></div><Button type="button" variant="outline" onClick={resetPassword} disabled={resettingPassword || !accountEmail} className="shrink-0 rounded-xl">{resettingPassword ? 'Envoi…' : 'Modifier le mot de passe'}</Button></div>
        {(message || error) && <p role={error ? 'alert' : 'status'} className={`mt-5 rounded-xl px-4 py-3 text-sm ${error ? 'bg-[#fdeceb] text-[#b8453c]' : 'bg-[#eaf5f1] text-[#286454]'}`}>{error || message}</p>}
      </section>
    </OwnerPageShell>
  );
}
