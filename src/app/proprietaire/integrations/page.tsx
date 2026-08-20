'use client';

import { CheckCircle2, Link2, Puzzle } from 'lucide-react';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import ProFeatureGate from '@/components/subscription/ProFeatureGate';

export default function IntegrationsPage() {
  return <OwnerPageShell title="Intégrations" subtitle="Connectez vos outils pour simplifier la gestion de vos séjours.">
    <ProFeatureGate title="Connectez vos outils" description="La synchronisation avec vos calendriers, PMS et outils de conciergerie est réservée aux abonnements Pro."><section className="grid gap-5 md:grid-cols-2">
      <article className="rounded-[2rem] border border-[#e4ddd6] bg-white p-7"><Puzzle className="text-[#d85b24]" /><h2 className="mt-6 text-xl font-semibold">Calendriers et PMS</h2><p className="mt-2 text-sm text-[#77736f]">Synchronisation Airbnb, Booking et outils de conciergerie prochainement.</p><span className="mt-5 inline-flex rounded-full bg-[#f5f2ec] px-3 py-1.5 text-xs font-semibold text-[#77736f]">Bientôt disponible</span></article>
      <article className="rounded-[2rem] bg-[#eaf5f1] p-7"><Link2 className="text-[#286454]" /><h2 className="mt-6 text-xl font-semibold text-[#204d41]">Votre lien de livret</h2><p className="mt-2 text-sm text-[#427367]">Chaque livret publié dispose déjà d’un lien voyageur sécurisé.</p><CheckCircle2 className="mt-5 text-[#286454]" /></article>
    </section></ProFeatureGate>
  </OwnerPageShell>;
}
