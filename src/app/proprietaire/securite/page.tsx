'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import EmailVerificationNotice from '@/components/auth/EmailVerificationNotice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/config/routes';
import { firebaseAuth } from '@/lib/firebase/client';
import { sendAccountPasswordReset } from '@/lib/firebase/account-emails';

export default function SecurityPage() {
  const [email, setEmail] = useState('');
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, (user) => {
    setEmail(user?.email ?? '');
    setHasPasswordProvider(Boolean(user?.providerData.some((provider) => provider.providerId === 'password')));
  }), []);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    const user = firebaseAuth.currentUser;
    if (!user?.email) return;
    if (newPassword.length < 12) {
      setError('Votre nouveau mot de passe doit contenir au moins 12 caractères.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSaving(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setMessage('Votre mot de passe a été modifié.');
    } catch (authenticationError) {
      const code = authenticationError && typeof authenticationError === 'object' && 'code' in authenticationError ? String(authenticationError.code) : '';
      setError(code === 'auth/wrong-password' || code === 'auth/invalid-credential' ? 'Le mot de passe actuel est incorrect.' : 'Impossible de modifier le mot de passe. Réessayez ou demandez un lien sécurisé.');
    } finally {
      setSaving(false);
    }
  };

  const sendResetLink = async () => {
    if (!email) return;
    setMessage('');
    setError('');
    setSendingLink(true);
    try {
      await sendAccountPasswordReset(email);
      setMessage(`Un lien de réinitialisation a été envoyé à ${email}.`);
    } catch {
      setError('Impossible d’envoyer le lien sécurisé. Réessayez dans un instant.');
    } finally {
      setSendingLink(false);
    }
  };

  return (
    <OwnerPageShell title="Sécurité du compte" subtitle="Gardez l’accès à votre espace propriétaire sous votre contrôle.">
      <EmailVerificationNotice />
      <Link href={ROUTES.OWNER_SETTINGS} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#67716c] transition hover:text-[#1f2925]"><ArrowLeft size={16} />Retour aux réglages</Link>
      <section className="max-w-2xl rounded-[2rem] border border-[#e4ddd6] bg-white p-6 shadow-[0_16px_38px_rgba(31,41,37,.05)] sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6e5db] text-[#d85b24]"><KeyRound size={22} /></span>
        <h1 className="mt-5 text-2xl font-semibold text-[#24292c]">Modifier le mot de passe</h1>
        <p className="mt-2 text-sm leading-6 text-[#77736f]">Votre adresse de connexion : <strong className="font-semibold text-[#2a3032]">{email || 'Chargement…'}</strong></p>

        {hasPasswordProvider ? <form onSubmit={changePassword} className="mt-7 space-y-4"><div><Label htmlFor="current-password">Mot de passe actuel</Label><Input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className="mt-2 h-11" required /></div><div><Label htmlFor="new-password">Nouveau mot de passe</Label><Input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={12} className="mt-2 h-11" required /></div><div><Label htmlFor="new-password-confirmation">Confirmez le nouveau mot de passe</Label><Input id="new-password-confirmation" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} className="mt-2 h-11" required /></div><p className="text-xs text-[#8a918e]">12 caractères minimum.</p><Button type="submit" disabled={saving || !email} className="h-11 rounded-xl bg-[#17232c] px-5">{saving ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}</Button></form> : <div className="mt-7 rounded-2xl border border-[#e7e0d8] bg-[#fcfaf8] p-5"><ShieldCheck className="text-[#367566]" size={22} /><h2 className="mt-3 font-semibold text-[#24292c]">Connexion gérée par votre fournisseur</h2><p className="mt-2 text-sm leading-6 text-[#77736f]">Votre compte n’utilise pas de mot de passe Mon Livret. Gérez sa sécurité chez votre fournisseur de connexion.</p></div>}

        <div className="mt-7 border-t border-[#eee8e2] pt-6"><div className="flex items-start gap-3"><Mail className="mt-0.5 text-[#d85b24]" size={19} /><div><h2 className="font-semibold text-[#24292c]">Vous avez oublié votre mot de passe ?</h2><p className="mt-1 text-sm leading-6 text-[#77736f]">Nous vous envoyons un lien unique et temporaire par e-mail.</p></div></div><Button type="button" variant="outline" onClick={sendResetLink} disabled={sendingLink || !email} className="mt-4 rounded-xl">{sendingLink ? 'Envoi…' : 'Recevoir un lien sécurisé'}</Button></div>
        {(message || error) && <p role={error ? 'alert' : 'status'} className={`mt-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${error ? 'bg-[#fdeceb] text-[#b8453c]' : 'bg-[#eaf5f1] text-[#286454]'}`}>{message && <CheckCircle2 size={17} />}{error || message}</p>}
      </section>
    </OwnerPageShell>
  );
}
