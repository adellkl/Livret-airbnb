'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Mail, Shield, Sparkles } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { firebaseAuth, firebaseAuthReady, firestore } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AccountTypeSelector from '@/components/auth/AccountTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const inputClass = 'auth-field h-13 rounded-xl border-[#1f2925]/10 bg-[#faf8f4] px-4 text-[#1f2925] shadow-none placeholder:text-[#9aa09c] focus-visible:border-[#d96c4a]/60 focus-visible:bg-white focus-visible:ring-[#d96c4a]/12';
const labelClass = 'text-xs font-bold uppercase tracking-[0.08em] text-[#4e5953]';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<'owner' | 'admin'>('owner');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) return;

    setIsSubmitting(true);
    setError('');
    try {
      await firebaseAuthReady;
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email.trim().toLowerCase(),
        password,
      );
      const profile = await getDoc(doc(firestore, 'profiles', credential.user.uid));
      const role = profile.data()?.role;

      if (!profile.exists() || (role !== 'owner' && role !== 'admin')) {
        await signOut(firebaseAuth);
        setError('Votre compte est incomplet. Contactez le support.');
        return;
      }

      if (accountType === 'admin' && role !== 'admin') {
        await signOut(firebaseAuth);
        setError('Ce compte ne dispose pas des droits administrateur.');
        return;
      }

      router.replace(role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.OWNER_DASHBOARD);
      router.refresh();
    } catch {
      setError('Adresse e-mail ou mot de passe incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell mode="login">
      <AuthCard>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex w-fit items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d96c4a]">
              <Sparkles className="h-3.5 w-3.5" /> Votre espace hôte
            </div>
            <h2 className="font-serif text-[clamp(2.25rem,7vw,3.15rem)] leading-none tracking-[-0.04em] text-[#1f2925]">Bon retour.</h2>
            <p className="mt-2 text-sm text-[#737b77]">Retrouvez vos livrets en quelques secondes.</p>
          </div>
          <span className="flex h-8 shrink-0 items-center rounded-full bg-[#f5f2ec] px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7c8580]">{step}/2</span>
        </div>

        <div className="mb-6 flex items-center" aria-label={`Étape ${step} sur 2`}>
          {['Votre compte', 'Mot de passe'].map((label, index) => {
            const itemStep = index + 1;
            const active = step >= itemStep;
            return (
              <div key={label} className={`flex items-center ${index === 0 ? 'flex-1' : ''}`}>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  active ? 'bg-[#1f2925] text-white' : 'bg-[#ece8e1] text-[#8c938f]'
                }`}>
                  {step > itemStep ? <Check size={13} /> : itemStep}
                </span>
                <span className={`ml-2 text-[10px] font-bold ${active ? 'text-[#1f2925]' : 'text-[#9aa09c]'}`}>{label}</span>
                {index === 0 && <span className={`mx-3 h-px flex-1 ${step === 2 ? 'bg-[#1f2925]' : 'bg-[#dedad3]'}`} />}
              </div>
            );
          })}
        </div>

        {step === 1 ? (
          <>
            <AccountTypeSelector value={accountType} onChange={setAccountType} compact />

            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setStep(2); }}>
              <div className="space-y-2">
                <Label htmlFor="email" className={labelClass}>Adresse e-mail</Label>
                <div className="relative">
                  <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#929995]" />
                  <Input
                    id="email" name="email" type="email" placeholder="vous@exemple.com" value={email}
                    onChange={(event) => { setEmail(event.target.value); setError(''); }}
                    autoComplete="email" className={`${inputClass} pl-11`} required autoFocus
                  />
                </div>
              </div>

              <Button type="submit" className="group h-13 w-full rounded-xl bg-[#1f2925] px-6 font-bold text-white shadow-[0_12px_26px_rgba(31,41,37,.18)] transition hover:-translate-y-0.5 hover:bg-[#324139]">
                Continuer <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </Button>

              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a6a3]">
                <span className="h-px flex-1 bg-[#1f2925]/8" /> ou <span className="h-px flex-1 bg-[#1f2925]/8" />
              </div>
              <GoogleSignInButton onError={setError} className="h-13 w-full rounded-xl border-[#1f2925]/10 bg-white text-[#1f2925] hover:bg-[#f7f4ee]" />
              {error && <p role="alert" className="rounded-xl bg-[#fdeceb] px-3 py-2 text-xs text-[#b8453c]">{error}</p>}
            </form>
          </>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <input type="hidden" name="username" autoComplete="username" value={email} />
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f5f2ec] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8b928e]">
                  {accountType === 'owner' ? 'Espace propriétaire' : 'Espace administrateur'}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[#1f2925]">{email}</p>
              </div>
              <button type="button" onClick={() => { setStep(1); setError(''); }} className="shrink-0 text-xs font-bold text-[#d96c4a] hover:underline">
                Modifier
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className={labelClass}>Mot de passe</Label>
                <Link href={ROUTES.FORGOT_PASSWORD} className="text-xs font-semibold text-[#d96c4a] hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Votre mot de passe"
                  value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }}
                  autoComplete="current-password" className={`${inputClass} pr-12`} required autoFocus
                />
                <button type="button" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShowPassword((shown) => !shown)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a928e] transition hover:text-[#1f2925]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
              <Label htmlFor="remember" className="cursor-pointer text-sm text-[#707874]">Se souvenir de moi</Label>
            </div>

            {error && <p role="alert" className="rounded-2xl bg-[#fdeceb] px-4 py-3 text-sm text-[#b8453c]">{error}</p>}

            <Button type="submit" disabled={isSubmitting} className="group h-13 w-full rounded-xl bg-[#1f2925] px-6 font-bold text-white shadow-[0_12px_26px_rgba(31,41,37,.18)] transition hover:-translate-y-0.5 hover:bg-[#324139] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Connexion…' : 'Se connecter'} <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
            </Button>

            <Button type="button" variant="ghost" onClick={() => { setStep(1); setError(''); }} className="h-11 w-full rounded-xl text-sm text-[#66706b] hover:bg-[#f7f4ee]">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-[#777f7b]">
          Nouveau ici ? <Link href={ROUTES.REGISTER} className="font-bold text-[#d96c4a] hover:underline">Créer un compte</Link>
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#1f2925]/8 pt-4 text-[11px] text-[#89908c]">
          <Shield size={14} className="text-[#78917c]" /> Connexion chiffrée et données protégées
        </div>
      </AuthCard>
    </AuthShell>
  );
}
