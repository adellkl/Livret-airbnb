'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Shield } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AccountTypeSelector from '@/components/auth/AccountTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from 'firebase/auth';
import { firebaseAuth, firebaseAuthReady } from '@/lib/firebase/client';
import { createOwnerProfile } from '@/lib/firebase/profile';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const inputClass = 'auth-field h-12 rounded-xl border-[#1f2925]/10 bg-[#faf8f4] px-3.5 text-sm text-[#1f2925] shadow-none placeholder:text-[#9aa09c] focus-visible:border-[#d96c4a]/60 focus-visible:bg-white focus-visible:ring-[#d96c4a]/12';
const labelClass = 'text-[10px] font-bold uppercase tracking-[0.08em] text-[#4e5953] sm:text-[11px]';

type Details = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  establishment: string;
  activityType: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'owner' | 'admin'>('owner');
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [details, setDetails] = useState<Details>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    establishment: '',
    activityType: '',
  });

  const updateDetail = (field: keyof Details, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const continueToActivity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (details.password.length < 12) {
      setError('Choisissez un mot de passe d’au moins 12 caractères.');
      return;
    }
    if (details.password !== details.confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setStep(2);
  };

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!acceptTerms || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    const fullName = `${details.firstName.trim()} ${details.lastName.trim()}`.trim();
    try {
      await firebaseAuthReady;
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        details.email.trim().toLowerCase(),
        details.password,
      );
      await updateProfile(credential.user, { displayName: fullName });
      try {
        await createOwnerProfile({
          uid: credential.user.uid,
          email: credential.user.email,
          fullName,
          organizationName: details.establishment.trim(),
          activityType: details.activityType,
        });
      } catch {
        await deleteUser(credential.user);
        throw new Error('profile-creation-failed');
      }
      router.replace(ROUTES.OWNER_DASHBOARD);
      router.refresh();
    } catch (registrationError) {
      const code = registrationError instanceof Error ? registrationError.message : '';
      setError(code.includes('email-already-in-use')
        ? 'Cette adresse e-mail est déjà utilisée.'
        : 'Impossible de créer le compte. Vérifiez les informations puis réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell mode="register">
      <AuthCard wide compact>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2.5 flex w-fit items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#d96c4a]">
              <Check className="h-3.5 w-3.5" /> Gratuit et sans engagement
            </div>
            <h2 className="font-serif text-[clamp(2rem,5vw,2.7rem)] leading-none tracking-[-0.035em] text-[#1f2925]">
              Créez votre espace.
            </h2>
            <p className="mt-2 text-xs text-[#737b77] sm:text-sm">Votre premier livret sera prêt en quelques minutes.</p>
          </div>
          {accountType === 'owner' && (
            <span className="flex h-8 shrink-0 items-center rounded-full bg-[#f5f2ec] px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7c8580]">{step}/2</span>
          )}
        </div>

        {accountType === 'owner' && (
          <div className="mb-5 flex items-center" aria-label={`Étape ${step} sur 2`}>
            {['Vos informations', 'Votre activité'].map((label, index) => {
              const itemStep = index + 1;
              const active = step >= itemStep;
              return (
                <div key={label} className={`flex items-center ${index === 0 ? 'flex-1' : ''}`}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
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
        )}

        {step === 1 && <AccountTypeSelector value={accountType} onChange={setAccountType} compact />}

        {accountType === 'owner' ? (
          step === 1 ? (
            <form className="space-y-3" onSubmit={continueToActivity}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className={labelClass}>Prénom</Label>
                  <Input id="firstName" name="firstName" type="text" placeholder="Jean" value={details.firstName} onChange={(event) => updateDetail('firstName', event.target.value)} autoComplete="given-name" className={inputClass} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className={labelClass}>Nom</Label>
                  <Input id="lastName" name="lastName" type="text" placeholder="Dupont" value={details.lastName} onChange={(event) => updateDetail('lastName', event.target.value)} autoComplete="family-name" className={inputClass} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className={labelClass}>Adresse e-mail</Label>
                <Input id="email" name="email" type="email" placeholder="vous@exemple.com" value={details.email} onChange={(event) => updateDetail('email', event.target.value)} autoComplete="email" className={inputClass} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className={labelClass}>Mot de passe</Label>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="12 caractères" value={details.password} onChange={(event) => updateDetail('password', event.target.value)} autoComplete="new-password" className={`${inputClass} pr-9`} minLength={12} required />
                    <button type="button" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShowPassword((shown) => !shown)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a928e] transition hover:text-[#1f2925]">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className={labelClass}>Confirmation</Label>
                  <div className="relative">
                    <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirmation" value={details.confirmPassword} onChange={(event) => updateDetail('confirmPassword', event.target.value)} autoComplete="new-password" className={`${inputClass} pr-9`} minLength={8} required />
                    <button type="button" aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'} onClick={() => setShowConfirmPassword((shown) => !shown)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a928e] transition hover:text-[#1f2925]">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && <p role="alert" className="rounded-xl bg-[#fdeceb] px-3 py-2 text-xs text-[#b8453c]">{error}</p>}
              <Button type="submit" className="group h-12 w-full rounded-xl bg-[#1f2925] px-6 text-sm font-bold text-white shadow-[0_12px_26px_rgba(31,41,37,.18)] transition hover:-translate-y-0.5 hover:bg-[#324139]">
                Continuer <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </Button>

              <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.14em] text-[#a1a6a3]">
                <span className="h-px flex-1 bg-[#1f2925]/8" /> ou <span className="h-px flex-1 bg-[#1f2925]/8" />
              </div>
              <GoogleSignInButton onError={setError} className="h-12 w-full rounded-xl border-[#1f2925]/10 bg-white text-sm text-[#1f2925] hover:bg-[#f7f4ee]" />
            </form>
          ) : (
            <form className="space-y-4" onSubmit={register}>
              <div className="flex items-center gap-3 rounded-xl border border-[#1f2925]/7 bg-[#f8f5f0] p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#d96c4a] shadow-sm"><Check size={15} /></span>
                <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d96c4a]">Dernière étape</p>
                <p className="mt-1 text-xs leading-relaxed text-[#707874]">Parlez-nous de votre activité pour personnaliser votre espace.</p>
                </div>
              </div>

              <div className="grid grid-cols-[1.1fr_.9fr] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="establishment" className={labelClass}>Établissement</Label>
                  <Input id="establishment" name="establishment" type="text" placeholder="L’Atelier des Batignolles" value={details.establishment} onChange={(event) => updateDetail('establishment', event.target.value)} autoComplete="organization" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="activityType" className={labelClass}>Activité</Label>
                  <select id="activityType" name="activityType" value={details.activityType} onChange={(event) => updateDetail('activityType', event.target.value)} className={`${inputClass} w-full appearance-none pr-8`}>
                    <option value="">Sélectionnez</option>
                    <option value="airbnb">Propriétaire Airbnb</option>
                    <option value="concierge">Conciergerie</option>
                    <option value="hotel">Hôtel</option>
                    <option value="guesthouse">Maison d’hôtes</option>
                    <option value="manager">Gestionnaire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['Guide mobile', 'Lien sécurisé', 'Mise à jour simple'].map((item) => (
                  <div key={item} className="rounded-xl border border-[#1f2925]/8 bg-white px-2 py-3 text-center text-[10px] font-semibold text-[#68716c]">
                    <Check className="mx-auto mb-1.5 h-3.5 w-3.5 text-[#78917c]" /> {item}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-[#f5f2ec] p-3">
                <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} className="mt-0.5" />
                <Label htmlFor="terms" className="cursor-pointer text-[10px] leading-relaxed text-[#69716d] sm:text-xs">
                  J’accepte les <Link href={ROUTES.TERMS} className="font-semibold text-[#d96c4a] hover:underline">conditions d’utilisation</Link> et la{' '}
                  <Link href={ROUTES.PRIVACY} className="font-semibold text-[#d96c4a] hover:underline">politique de confidentialité</Link>.
                </Label>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 rounded-xl border-[#1f2925]/10 bg-white px-5 text-sm text-[#1f2925] hover:bg-[#f7f4ee]">
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour
                </Button>
                <Button type="submit" disabled={!acceptTerms || isSubmitting} className="group h-12 rounded-xl bg-[#1f2925] px-6 text-sm font-bold text-white shadow-[0_12px_26px_rgba(31,41,37,.18)] transition hover:-translate-y-0.5 hover:bg-[#324139] disabled:bg-[#b8bcb9]">
                  {isSubmitting ? 'Création…' : 'Créer mon compte'} <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                </Button>
              </div>
              {error && <p role="alert" className="rounded-xl bg-[#fdeceb] px-3 py-2 text-xs text-[#b8453c]">{error}</p>}
            </form>
          )
        ) : (
          <div className="rounded-[1.5rem] bg-[#f5f2ec] px-6 py-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#d96c4a] shadow-sm"><Shield size={24} /></span>
            <h3 className="mt-5 font-serif text-2xl text-[#1f2925]">Accès sur invitation</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#707874]">Les comptes administrateurs sont créés uniquement par invitation sécurisée.</p>
            <Link href={ROUTES.LOGIN} className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[#1f2925]/10 bg-white px-5 text-sm font-semibold text-[#1f2925]">Retour à la connexion</Link>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-[#777f7b]">
          Déjà un compte ? <Link href={ROUTES.LOGIN} className="font-bold text-[#d96c4a] hover:underline">Se connecter</Link>
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#1f2925]/8 pt-3 text-[10px] text-[#89908c] sm:text-xs">
          <Shield size={14} className="text-[#78917c]" /> Connexion chiffrée et données protégées
        </div>
      </AuthCard>
    </AuthShell>
  );
}
