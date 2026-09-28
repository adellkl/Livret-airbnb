'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { ArrowLeft, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import AuthCard from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/config/routes';
import { firebaseAuth } from '@/lib/firebase/client';

type LinkState = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const [linkState, setLinkState] = useState<LinkState>('checking');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const resetCode = new URLSearchParams(window.location.search).get('oobCode') ?? '';
    if (!resetCode) {
      queueMicrotask(() => setLinkState('invalid'));
      return undefined;
    }

    let active = true;
    void verifyPasswordResetCode(firebaseAuth, resetCode)
      .then((accountEmail) => {
        if (!active) return;
        setCode(resetCode);
        setEmail(accountEmail);
        setLinkState('ready');
      })
      .catch(() => {
        if (active) setLinkState('invalid');
      });

    return () => { active = false; };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 12) {
      setError('Votre nouveau mot de passe doit contenir au moins 12 caractères.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(firebaseAuth, code, password);
      setCompleted(true);
    } catch {
      setError('Ce lien a expiré ou n’est plus valide. Demandez un nouveau lien de réinitialisation.');
      setLinkState('invalid');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f3ef] p-4">
      <div className="w-full max-w-md">
        <Link href={ROUTES.LOGIN} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#69716d] transition hover:text-[#1f2925]"><ArrowLeft size={16} />Retour à la connexion</Link>
        <AuthCard>
          {linkState === 'checking' && <div className="py-10 text-center"><KeyRound className="mx-auto h-9 w-9 animate-pulse text-[#d96c4a]" /><p className="mt-4 text-sm text-muted-foreground">Vérification du lien sécurisé…</p></div>}
          {linkState === 'invalid' && <div className="py-5 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fdeceb] text-[#b8453c]"><ShieldAlert size={26} /></span><h1 className="mt-5 text-2xl font-semibold text-foreground">Lien non valide</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Ce lien a expiré, a déjà été utilisé ou ne peut pas être vérifié.</p><Link href={ROUTES.FORGOT_PASSWORD} className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-[#17232c] px-5 text-sm font-semibold text-white">Demander un nouveau lien</Link></div>}
          {linkState === 'ready' && !completed && <><div className="mb-7"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6e5db] text-[#d85b24]"><KeyRound size={22} /></span><h1 className="mt-5 text-2xl font-semibold text-foreground">Choisissez un nouveau mot de passe</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Vous réinitialisez le mot de passe du compte <strong className="font-semibold text-foreground">{email}</strong>.</p></div><form onSubmit={handleSubmit} className="space-y-4"><div><Label htmlFor="password">Nouveau mot de passe</Label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} className="mt-2 h-12" required /></div><div><Label htmlFor="confirmation">Confirmez le mot de passe</Label><Input id="confirmation" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} className="mt-2 h-12" required /></div><p className="text-xs text-muted-foreground">12 caractères minimum.</p>{error && <p role="alert" className="rounded-xl bg-[#fdeceb] px-3 py-2.5 text-sm text-[#b8453c]">{error}</p>}<Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-[#17232c] text-white hover:bg-[#293d46]">{isSubmitting ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}</Button></form></>}
          {completed && <div className="py-5 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f1ec] text-[#367566]"><CheckCircle2 size={28} /></span><h1 className="mt-5 text-2xl font-semibold text-foreground">Mot de passe mis à jour</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p><Link href={ROUTES.LOGIN} className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-[#17232c] px-5 text-sm font-semibold text-white">Se connecter</Link></div>}
        </AuthCard>
      </div>
    </div>
  );
}
