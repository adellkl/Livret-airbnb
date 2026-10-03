'use client';

import { contactEmailLink } from '@/config/contact';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowRight, Building2, Check, Crown, Home, LockKeyhole, Sparkles } from 'lucide-react';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { ROUTES } from '@/config/routes';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { type SubscriptionPlan, useSubscription } from '@/hooks/useSubscription';

type PlanCard = {
  id: SubscriptionPlan;
  name: string;
  audience: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  icon: typeof Home;
};

const plans: PlanCard[] = [
  {
    id: 'free',
    name: 'Gratuit',
    audience: 'Pour un premier logement',
    price: '0 €',
    cadence: 'sans engagement',
    description: 'Créez, publiez et partagez votre premier guide avec un lien et un QR code.',
    features: ['1 logement inclus', 'Guide privé et QR code', 'Messagerie voyageur', 'Mises à jour à tout moment'],
    icon: Home,
  },
  {
    id: 'pro',
    name: 'Pro',
    audience: 'Pour développer votre activité',
    price: 'À partir de 39 €',
    cadence: 'par mois, facturé annuellement',
    description: 'Centralisez jusqu’à 25 logements et pilotez l’expérience de vos voyageurs.',
    features: ['Jusqu’à 25 logements', 'Statistiques avancées', 'Intégrations et modèles', '3 membres d’équipe'],
    icon: Sparkles,
  },
  {
    id: 'business',
    name: 'Business',
    audience: 'Pour les conciergeries et équipes',
    price: 'À partir de 79 €',
    cadence: 'par mois, facturé annuellement',
    description: 'Déployez une expérience de marque cohérente à grande échelle.',
    features: ['Logements et utilisateurs illimités', 'Marque blanche', 'Domaine personnalisé', 'Onboarding et support dédiés'],
    icon: Building2,
  },
];

const planRank: Record<SubscriptionPlan, number> = { free: 0, pro: 1, business: 2 };

export default function SubscriptionPage() {
  const { plan, isLoading } = useSubscription();
  const [propertyCount, setPropertyCount] = useState<number | null>(null);

  useEffect(() => {
    let stopProperties: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopProperties?.();
      if (!user) {
        setPropertyCount(null);
        return;
      }
      stopProperties = onSnapshot(
        query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)),
        (snapshot) => setPropertyCount(snapshot.size),
        () => setPropertyCount(null),
      );
    });

    return () => {
      stopProperties?.();
      stopAuth();
    };
  }, []);

  const currentPlan = plans.find((item) => item.id === plan) ?? plans[0];
  const nextPlan = plans.find((item) => planRank[item.id] === planRank[plan] + 1);
  const usageLimit = plan === 'free' ? 1 : plan === 'pro' ? 25 : null;
  const usagePercent = usageLimit && propertyCount !== null ? Math.min(100, Math.round((propertyCount / usageLimit) * 100)) : 0;

  return (
    <OwnerPageShell title="Mon abonnement" subtitle="Choisissez la formule qui accompagne la croissance de votre activité.">
      <section className="mb-8 overflow-hidden rounded-[2rem] bg-[#17232c] p-6 text-white shadow-[0_18px_45px_rgba(23,35,44,.14)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#ef9a78]"><Crown size={14} /> Votre formule actuelle</p>
            <h1 className="mt-3 text-3xl font-semibold">{isLoading ? 'Chargement…' : currentPlan.name}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">{currentPlan.description}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.06] px-5 py-4 lg:min-w-56">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/50">Logements utilisés</p>
            <p className="mt-2 text-2xl font-semibold">{propertyCount === null ? '—' : propertyCount}{usageLimit ? ` / ${usageLimit}` : ' · illimités'}</p>
            {usageLimit && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ef9a78] transition-all" style={{ width: `${usagePercent}%` }} /></div>}
          </div>
        </div>
        {nextPlan && !isLoading && <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-white/70">Prochaine étape : <strong className="text-white">{nextPlan.name}</strong> — {nextPlan.audience.toLocaleLowerCase('fr-FR')}.</p><Link href={nextPlan.id === 'business' ? contactEmailLink('Mon Livret Business') : ROUTES.PRICING} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#e7754d] px-4 py-2.5 text-sm font-semibold text-white">{nextPlan.id === 'business' ? 'Parler de Business' : 'Voir Pro'}<ArrowRight size={16} /></Link></div>}
      </section>

      <section aria-label="Parcours des formules">
        <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#d85b24]">Votre parcours</p><h2 className="mt-2 text-2xl font-semibold text-[#24292c]">Une formule pour chaque étape</h2></div>
        <div className="grid gap-5 xl:grid-cols-3">
          {plans.map((item) => {
            const isCurrent = item.id === plan;
            const isLocked = planRank[item.id] > planRank[plan];
            const Icon = item.icon;
            const action = isCurrent
              ? { label: 'Formule active', href: ROUTES.OWNER_DASHBOARD }
              : item.id === 'free'
                ? { label: 'Continuer gratuitement', href: propertyCount ? ROUTES.OWNER_PROPERTIES : ROUTES.OWNER_PROPERTY_NEW }
                : item.id === 'business'
                  ? { label: 'Parler à un expert', href: contactEmailLink('Mon Livret Business') }
                  : { label: 'Choisir Pro', href: ROUTES.PRICING };

            return (
              <article key={item.id} className={`relative flex min-h-full flex-col overflow-hidden rounded-[2rem] border p-6 sm:p-7 ${isCurrent ? 'border-[#17232c] bg-[#17232c] text-white shadow-[0_20px_48px_rgba(23,35,44,.16)]' : 'border-[#e4ddd6] bg-white text-[#24292c]'}`}>
                {isCurrent && <span className="absolute right-0 top-0 rounded-bl-2xl bg-[#e7754d] px-4 py-2 text-[9px] font-bold uppercase tracking-[.14em]">Formule active</span>}
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isCurrent ? 'bg-white/10 text-[#ef9a78]' : 'bg-[#f5e9e2] text-[#d85b24]'}`}><Icon size={20} /></span>
                <p className={`mt-6 text-[10px] font-bold uppercase tracking-[.16em] ${isCurrent ? 'text-white/55' : 'text-[#78917c]'}`}>{item.audience}</p>
                <h3 className="mt-2 text-2xl font-semibold">{item.name}</h3>
                <p className={`mt-3 text-sm leading-6 ${isCurrent ? 'text-white/68' : 'text-[#6d7471]'}`}>{item.description}</p>
                <div className="mt-6 border-t border-current/10 pt-5"><p className="text-3xl font-semibold">{item.price}</p><p className={`mt-1 text-xs ${isCurrent ? 'text-white/52' : 'text-[#8a918e]'}`}>{item.cadence}</p></div>
                <ul className="mt-6 space-y-3">
                  {item.features.map((feature) => <li key={feature} className={`flex items-start gap-2.5 text-sm ${isCurrent ? 'text-white/78' : 'text-[#52605a]'}`}><Check className={`mt-0.5 h-4 w-4 shrink-0 ${isCurrent ? 'text-[#ef9a78]' : 'text-[#367566]'}`} strokeWidth={3} />{feature}</li>)}
                </ul>
                <Link href={action.href} className={`mt-8 flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${isCurrent ? 'bg-white text-[#17232c] hover:bg-white/90' : isLocked ? 'bg-[#e7754d] text-white hover:bg-[#ce603f]' : 'border border-[#d9d3cc] text-[#24332d] hover:bg-[#f8f5f1]'}`}>{isLocked && <LockKeyhole size={15} />}{action.label}<ArrowRight size={15} /></Link>
              </article>
            );
          })}
        </div>
      </section>
    </OwnerPageShell>
  );
}
