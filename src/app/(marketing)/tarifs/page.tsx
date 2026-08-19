'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  HelpCircle,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import PricingCard from '@/components/marketing/PricingCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ROUTES } from '@/config/routes';

const comparisonFeatures = [
  { feature: 'Logements inclus', starter: '5', pro: '25', business: 'Illimités' },
  { feature: 'Utilisateurs', starter: '1', pro: '3', business: 'Illimités' },
  { feature: 'Livrets et QR codes', starter: true, pro: true, business: true },
  { feature: 'Traductions automatiques', starter: true, pro: true, business: true },
  { feature: 'Statistiques avancées', starter: false, pro: true, business: true },
  { feature: 'Modèles réutilisables', starter: false, pro: true, business: true },
  { feature: 'Marque blanche', starter: false, pro: false, business: true },
  { feature: 'Domaine personnalisé', starter: false, pro: false, business: true },
  { feature: 'Accompagnement', starter: 'Email', pro: 'Prioritaire', business: 'Dédié' },
];

const faqs = [
  {
    question: 'Puis-je essayer avant de payer ?',
    answer:
      'Oui. Vous disposez de 14 jours pour créer votre livret, le personnaliser et le tester avec vos voyageurs. Aucune carte bancaire n’est demandée au démarrage.',
  },
  {
    question: 'Puis-je changer d’offre à tout moment ?',
    answer:
      'Oui. Vous pouvez monter ou descendre d’offre depuis votre espace. Le changement est calculé automatiquement au prorata de votre période en cours.',
  },
  {
    question: 'L’abonnement annuel est-il payé en une fois ?',
    answer:
      'Oui. L’abonnement annuel est facturé en une fois et vous fait économiser l’équivalent de deux mois par rapport au paiement mensuel.',
  },
  {
    question: 'Que se passe-t-il si je dépasse ma limite de logements ?',
    answer:
      'Nous vous prévenons avant tout blocage. Vos livrets restent accessibles et vous pouvez passer à l’offre supérieure en quelques clics.',
  },
  {
    question: 'Proposez-vous une offre pour les conciergeries ?',
    answer:
      'Oui. L’offre Business s’adapte aux équipes, agences et conciergeries. Nous pouvons également préparer un accompagnement et une migration sur mesure.',
  },
];

function ComparisonValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="font-semibold text-[#4e5a54]">{value}</span>;
  }

  return value ? (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#e4f0ea] text-[#3f8171]">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  ) : (
    <X className="mx-auto h-4 w-4 text-[#1f2925]/20" />
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      title: 'Starter',
      audience: '1 à 5 logements',
      price: isAnnual ? '15 €' : '19 €',
      period: '/ mois',
      priceNote: isAnnual ? '180 € facturés annuellement' : 'Facturation mensuelle',
      description:
        'Pour créer de beaux livrets et professionnaliser vos premiers accueils.',
      valueNote: 'Tout l’essentiel pour réduire les questions répétitives.',
      features: [
        'Jusqu’à 5 logements',
        'Livrets, liens et QR codes',
        'Traductions automatiques',
        'Support par email',
      ],
      ctaText: 'Essayer Starter',
      ctaHref: ROUTES.REGISTER,
    },
    {
      title: 'Pro',
      audience: '6 à 25 logements',
      price: isAnnual ? '39 €' : '49 €',
      period: '/ mois',
      priceNote: isAnnual ? '468 € facturés annuellement' : 'Facturation mensuelle',
      description:
        'Pour centraliser vos logements, gagner du temps et piloter vos performances.',
      valueNote: isAnnual
        ? 'À partir de 1,56 € par logement et par mois.'
        : 'Pensé pour les hôtes qui veulent passer à l’échelle.',
      features: [
        'Tout ce qui est inclus dans Starter',
        'Jusqu’à 25 logements',
        'Statistiques avancées',
        '3 membres d’équipe inclus',
        'Support prioritaire',
      ],
      popular: true,
      ctaText: 'Choisir Pro',
      ctaHref: ROUTES.REGISTER,
    },
    {
      title: 'Business',
      audience: 'Conciergeries & équipes',
      price: isAnnual ? '79 €' : '99 €',
      period: '/ mois',
      priceNote: isAnnual ? '948 € facturés annuellement' : 'Facturation mensuelle',
      description:
        'Pour déployer une expérience de marque cohérente, sans limite de volume.',
      valueNote: 'Un accompagnement dédié pour déployer plus vite.',
      features: [
        'Tout ce qui est inclus dans Pro',
        'Logements et utilisateurs illimités',
        'Marque blanche et domaine personnalisé',
        'Onboarding et support dédiés',
      ],
      ctaText: 'Parler à un expert',
      ctaHref: 'mailto:bonjour@livret-accueil.fr',
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pb-24 lg:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-12 h-96 w-96 -translate-x-1/2 rounded-full bg-[#ead9cc]/45 blur-3xl" />
        <div className="relative mx-auto max-w-[1240px]">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1f2925]/9 bg-white/75 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d7872] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#d96c4a]" />
              14 jours offerts · Sans carte bancaire
            </div>
            <h1 className="type-section mt-7 text-balance font-serif leading-[1.03] tracking-[-0.04em] text-[#1f2925] sm:text-[4.4rem]">
              Un meilleur accueil coûte moins{' '}
              <span className="italic text-[#d96c4a]">
                qu’une seule nuit.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#68716c] sm:text-lg">
              Moins de messages répétitifs, des voyageurs plus autonomes et une
              expérience à la hauteur de votre logement.
            </p>

            <div className="mt-9 flex justify-center">
              <div className="relative inline-flex rounded-full border border-[#1f2925]/9 bg-white p-1.5 shadow-[0_10px_35px_rgba(31,41,37,.08)]">
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  aria-pressed={!isAnnual}
                  className={`relative z-10 min-w-28 rounded-full px-5 py-3 text-sm font-bold transition ${
                    !isAnnual
                      ? 'bg-[#1f2925] text-white shadow-sm'
                      : 'text-[#707a74]'
                  }`}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  aria-pressed={isAnnual}
                  className={`relative z-10 min-w-28 rounded-full px-5 py-3 text-sm font-bold transition ${
                    isAnnual
                      ? 'bg-[#1f2925] text-white shadow-sm'
                      : 'text-[#707a74]'
                  }`}
                >
                  Annuel
                </button>
                <span className="absolute -right-3 -top-3 rounded-full bg-[#d96c4a] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-white shadow-sm">
                  2 mois offerts
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold text-[#748079]">
              {[
                [CreditCard, 'Aucune carte requise'],
                [LockKeyhole, 'Paiement sécurisé'],
                [CheckCircle2, 'Résiliable à tout moment'],
              ].map(([Icon, label]) => (
                <span key={label as string} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-[#3f8171]" />
                  {label as string}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3 md:items-stretch">
            {plans.map((plan) => (
              <PricingCard key={plan.title} {...plan} />
            ))}
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-[#7a847e]">
            Tous les prix sont affichés hors taxes. Votre essai reste gratuit,
            même si vous ne choisissez aucune offre.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1180px] overflow-hidden rounded-[2.5rem] bg-[#1f2925] text-white shadow-[0_35px_90px_rgba(31,41,37,.18)] lg:grid-cols-[1.1fr_.9fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f19a7e]">
              Un investissement utile
            </p>
            <h2 className="mt-5 max-w-xl font-serif text-4xl leading-[1.05] tracking-[-0.035em] sm:text-5xl">
              Rentabilisé avant même le premier check-in.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/65">
              Centralisez les réponses que vous répétez chaque semaine et
              rendez-les accessibles au bon moment, sur tous les téléphones.
            </p>
            <Link
              href={ROUTES.REGISTER}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#d96c4a] px-6 text-sm font-bold text-white transition hover:bg-[#c85f40]"
            >
              Créer mon premier livret
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid border-t border-white/10 sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0">
            {[
              {
                icon: Clock3,
                value: '2 h 30',
                label: 'gagnées en moyenne chaque semaine',
              },
              {
                icon: Zap,
                value: '1 lien',
                label: 'pour toutes les informations utiles',
              },
              {
                icon: ShieldCheck,
                value: '0 app',
                label: 'à télécharger pour vos voyageurs',
              },
            ].map((item) => (
              <div
                key={item.value}
                className="border-b border-white/10 p-7 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b lg:border-r-0"
              >
                <item.icon className="h-5 w-5 text-[#f19a7e]" />
                <p className="mt-4 font-serif text-3xl">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-white/55">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker">Comparer les offres</p>
            <h2 className="mt-4 font-serif text-4xl tracking-[-0.035em] text-[#1f2925] sm:text-5xl">
              Choisissez sans mauvaise surprise.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#69716d]">
              Les fonctions essentielles sont incluses dès Starter. Passez à
              l’offre supérieure lorsque votre activité grandit.
            </p>
          </div>

          <div className="mt-12 overflow-clip rounded-[2rem] border border-[#1f2925]/9 bg-[#fbfaf8] shadow-[0_20px_60px_rgba(31,41,37,.06)]">
            <div className="md:hidden">
              <div className="sticky top-[76px] z-20 grid grid-cols-[1.55fr_repeat(3,0.8fr)] border-b border-[#1f2925]/10 bg-white/95 backdrop-blur-xl">
                <div className="flex items-center px-4 py-4 text-[8px] font-bold uppercase tracking-[0.13em] text-[#7a847e]">
                  Fonction
                </div>
                <div className="flex items-center justify-center py-4 font-serif text-sm text-[#1f2925]">
                  Starter
                </div>
                <div className="relative flex items-center justify-center bg-[#f3e6dd] py-4 font-serif text-sm text-[#b95135]">
                  <span className="absolute top-1 text-[6px] font-sans font-bold uppercase tracking-[0.09em]">
                    Recommandé
                  </span>
                  <span className="pt-2">Pro</span>
                </div>
                <div className="flex items-center justify-center py-4 font-serif text-sm text-[#1f2925]">
                  Business
                </div>
              </div>

              <div>
                {comparisonFeatures.map((item, index) => (
                  <div
                    key={item.feature}
                    className={`grid min-h-16 grid-cols-[1.55fr_repeat(3,0.8fr)] border-b border-[#1f2925]/8 last:border-b-0 ${
                      index % 2 === 0 ? 'bg-white/55' : 'bg-[#fbfaf8]'
                    }`}
                  >
                    <p className="flex items-center px-4 py-3 text-[11px] font-semibold leading-[1.35] text-[#354039]">
                      {item.feature}
                    </p>
                    <div className="flex items-center justify-center border-l border-[#1f2925]/7 px-1 text-center text-[10px]">
                      <ComparisonValue value={item.starter} />
                    </div>
                    <div className="flex items-center justify-center border-l border-[#d96c4a]/10 bg-[#f7eee8]/75 px-1 text-center text-[10px]">
                      <ComparisonValue value={item.pro} />
                    </div>
                    <div className="flex items-center justify-center border-l border-[#1f2925]/7 px-1 text-center text-[10px]">
                      <ComparisonValue value={item.business} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-[#1f2925]/9 bg-white">
                    <th className="sticky left-0 z-10 bg-white p-5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a847e]">
                      Fonctionnalités
                    </th>
                    {['Starter', 'Pro', 'Business'].map((plan) => (
                      <th
                        key={plan}
                        className={`p-5 text-center font-serif text-xl text-[#1f2925] ${
                          plan === 'Pro' ? 'bg-[#f7eee8]' : ''
                        }`}
                      >
                        {plan}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item) => (
                    <tr
                      key={item.feature}
                      className="border-b border-[#1f2925]/7 last:border-b-0"
                    >
                      <td className="sticky left-0 z-10 bg-[#fbfaf8] p-5 text-sm font-semibold text-[#354039]">
                        {item.feature}
                      </td>
                      <td className="p-5 text-center text-sm">
                        <ComparisonValue value={item.starter} />
                      </td>
                      <td className="bg-[#f7eee8]/65 p-5 text-center text-sm">
                        <ComparisonValue value={item.pro} />
                      </td>
                      <td className="p-5 text-center text-sm">
                        <ComparisonValue value={item.business} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1080px] gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4e8df] text-[#d96c4a]">
              <HelpCircle className="h-5 w-5" />
            </span>
            <p className="section-kicker mt-6">Questions fréquentes</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.035em] text-[#1f2925]">
              Tout ce qu’il faut savoir avant de commencer.
            </h2>
            <p className="mt-5 text-sm leading-6 text-[#69716d]">
              Une question plus spécifique ? Écrivez-nous à{' '}
              <a
                href="mailto:bonjour@livret-accueil.fr"
                className="font-bold text-[#d96c4a]"
              >
                bonjour@livret-accueil.fr
              </a>
              .
            </p>
          </div>

          <Accordion className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`item-${index}`}
                className="border-[#1f2925]/10"
              >
                <AccordionTrigger className="py-6 text-left text-base font-semibold text-[#1f2925] hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl pb-6 text-sm leading-6 text-[#69716d]">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:pb-32">
        <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[2.5rem] bg-[#d96c4a] px-7 py-14 text-center text-white shadow-[0_28px_80px_rgba(217,108,74,.24)] sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -bottom-28 -right-12 h-72 w-72 rounded-full border border-white/15" />
          <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
            Votre accueil commence ici
          </p>
          <h2 className="relative mx-auto mt-5 max-w-3xl font-serif text-4xl leading-[1.05] tracking-[-0.035em] sm:text-5xl">
            Testez tout. Payez seulement si vos voyageurs l’adorent.
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
            Créez votre premier livret aujourd’hui. Vous avez 14 jours pour
            décider, sans carte bancaire et sans engagement.
          </p>
          <Link
            href={ROUTES.REGISTER}
            className="relative mt-8 inline-flex h-13 items-center gap-2 rounded-xl bg-white px-7 text-sm font-bold text-[#b94e31] shadow-[0_14px_30px_rgba(117,43,25,.2)] transition hover:-translate-y-0.5"
          >
            Commencer gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
