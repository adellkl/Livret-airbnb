import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, BarChart3, Check, ChevronRight, Clock3, Globe2, KeyRound,
  MapPin, MessageCircleMore, QrCode, ShieldCheck, Sparkles, Star,
  UtensilsCrossed, Wifi,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import AnimatedGuestJourney from '@/components/marketing/AnimatedGuestJourney';
import DesktopHeroBanner from '@/components/marketing/DesktopHeroBanner';
import Reveal from '@/components/marketing/Reveal';

const benefits = [
  { icon: KeyRound, title: 'Arrivée sans stress', text: 'Accès, parking, digicode et check-in réunis au même endroit.' },
  { icon: MessageCircleMore, title: 'Moins de questions', text: 'Vos voyageurs trouvent la réponse, même quand vous n’êtes pas disponible.' },
  { icon: Star, title: 'Plus de 5 étoiles', text: 'Une expérience fluide et attentionnée qui marque les esprits.' },
];

const features = [
  {
    icon: QrCode, kicker: 'Partage instantané', title: 'Un lien ou un QR code. C’est tout.',
    text: 'Aucune application à télécharger. Votre guide s’ouvre en un geste, sur tous les téléphones.',
    className: 'lg:col-span-2 bg-[#1f2925] text-white', accent: true,
  },
  {
    icon: Globe2, kicker: 'Voyageurs internationaux', title: 'Parlez leur langue',
    text: 'Votre livret est disponible en plusieurs langues pour accueillir chacun avec la même attention.',
    className: 'bg-[#d96c4a] text-white', accent: true,
  },
  {
    icon: BarChart3, kicker: 'Toujours à jour', title: 'Modifiez une fois, publiez partout',
    text: 'Horaires, bonnes adresses ou consignes : chaque changement est visible immédiatement.',
    className: 'bg-white text-[#1f2925]', accent: false,
  },
  {
    icon: ShieldCheck, kicker: 'Simple et sécurisé', title: 'Les bonnes infos, aux bonnes personnes',
    text: 'Un accès privé pour chaque logement et des données hébergées en Europe.',
    className: 'lg:col-span-2 bg-[#e7e4d6] text-[#1f2925]', accent: false,
  },
];

const steps = [
  ['01', 'Choisissez vos sections', 'Arrivée, Wi-Fi, équipements, bonnes adresses… partez d’une trame déjà prête.'],
  ['02', 'Ajoutez votre touche', 'Vos photos, votre ton et vos recommandations rendent le guide vraiment personnel.'],
  ['03', 'Partagez avant l’arrivée', 'Envoyez le lien automatiquement ou affichez le QR code dans le logement.'],
];

function PhonePreview() {
  const items = [
    { icon: KeyRound, label: 'Mon arrivée' },
    { icon: Wifi, label: 'Wi-Fi' },
    { icon: UtensilsCrossed, label: 'À proximité' },
    { icon: MapPin, label: 'Bonnes adresses' },
  ];

  return (
    <div className="relative mx-auto w-[238px] rounded-[2.7rem] border-[7px] border-[#20201e] bg-[#20201e] p-1 shadow-[0_32px_80px_rgba(23,29,26,.28)] sm:w-[270px]">
      <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-[#20201e]" />
      <div className="overflow-hidden rounded-[2.15rem] bg-[#fbf8f1]">
        <div className="relative h-44 sm:h-52">
          <Image src="/images/apartment.jpg" alt="Appartement lumineux présenté dans le livret" fill sizes="270px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">Bienvenue à</p>
            <p className="mt-1 font-serif text-[22px] leading-none">Casa Levante</p>
          </div>
        </div>
        <div className="p-3.5">
          <p className="text-xs font-semibold text-[#1f2925]">Tout pour votre séjour</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {items.map((item) => (
              <div key={item.label} className="rounded-xl bg-white p-2.5 shadow-[0_4px_16px_rgba(31,41,37,.06)]">
                <item.icon className="mb-2 h-4 w-4 text-[#d96c4a]" />
                <span className="text-[9px] font-semibold text-[#1f2925]">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#e7e4d6] px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#78917c] text-white">
              <MessageCircleMore className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-[#1f2925]">Besoin d’aide ?</p>
              <p className="text-[8px] text-[#67716c]">Contactez votre hôte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <DesktopHeroBanner />

      <section className="relative overflow-hidden bg-[#f5f0e8] lg:hidden">
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#e8b9a7]/35 blur-3xl" />
        <div className="mx-auto grid min-h-[720px] max-w-[1440px] items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[.88fr_1.12fr] lg:px-12 lg:pb-24 lg:pt-16 xl:px-20">
          <div className="relative z-10 max-w-[650px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1f2925]/10 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#516358]">
              <Sparkles className="h-3.5 w-3.5 text-[#d96c4a]" /> L’attention qui change tout
            </div>
            <h1 className="type-hero max-w-[720px] text-balance font-serif leading-[.94] tracking-[-0.045em] text-[#1f2925]">
              Un accueil mémorable, <span className="italic text-[#d96c4a]">avant même</span> l’arrivée.
            </h1>
            <p className="type-lead mt-7 max-w-[590px] leading-relaxed text-[#5f6863]">
              Créez un livret d’accueil digital aussi soigné que votre logement. Moins de questions pour vous,
              plus de sérénité pour vos voyageurs.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={ROUTES.REGISTER} className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#d96c4a] px-7 font-semibold text-white shadow-[0_12px_32px_rgba(217,108,74,.28)] transition hover:-translate-y-0.5 hover:bg-[#c85f40]">
                Créer mon livret gratuitement <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="#apercu" className="inline-flex h-14 items-center justify-center rounded-full border border-[#1f2925]/15 bg-white/55 px-7 font-semibold text-[#1f2925] transition hover:bg-white">
                Découvrir l’expérience
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#66706b]">
              {['Sans carte bancaire', 'Prêt en 10 minutes', 'Modifiable à tout moment'].map((item) => (
                <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#78917c]" /> {item}</span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[590px] lg:min-h-[650px]">
            <div className="absolute inset-y-0 right-0 w-[88%] overflow-hidden rounded-[2.4rem] sm:w-[84%] lg:w-[87%]">
              <Image src="/images/hero-villa.jpg" alt="Belle maison de vacances contemporaine" fill priority sizes="(max-width: 1024px) 90vw, 54vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f2925]/35 via-transparent to-white/5" />
            </div>
            <div className="absolute bottom-8 left-0 z-10 sm:left-8 lg:-left-1"><PhonePreview /></div>
            <div className="absolute right-4 top-7 z-10 rounded-2xl border border-white/30 bg-white/85 px-4 py-3 shadow-xl backdrop-blur-md sm:right-8">
              <div className="flex items-center gap-2 text-[#1f2925]">
                <div className="flex -space-x-1">
                  {['E', 'M', 'J'].map((letter, i) => (
                    <span key={letter} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white" style={{ backgroundColor: ['#d96c4a', '#78917c', '#1f2925'][i] }}>{letter}</span>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 text-[#d96c4a]">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div>
                  <p className="mt-0.5 text-[10px] font-semibold">Des voyageurs bien accueillis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#1f2925]/8 bg-white">
        <div className="mx-auto grid max-w-[1280px] divide-y divide-[#1f2925]/8 px-5 md:grid-cols-3 md:divide-x md:divide-y-0">
          {benefits.map((benefit, index) => (
            <Reveal key={benefit.title} className="flex gap-4 px-2 py-8 sm:px-8" delay={index * 0.08}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f0e8] text-[#d96c4a]"><benefit.icon className="h-5 w-5" /></div>
              <div><h2 className="font-semibold text-[#1f2925]">{benefit.title}</h2><p className="mt-1 text-sm leading-relaxed text-[#69716d]">{benefit.text}</p></div>
            </Reveal>
          ))}
        </div>
      </section>

      <AnimatedGuestJourney />

      <section id="apercu" className="bg-[#fbf8f3] px-5 pb-24 pt-16 sm:px-8 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1280px]">
          <Reveal className="grid items-end gap-8 lg:grid-cols-2">
            <div>
              <p className="section-kicker">Une expérience à votre image</p>
              <h2 className="type-section mt-4 max-w-2xl font-serif leading-[1.02] tracking-[-0.035em] text-[#1f2925]">Le guide que vos voyageurs vont vraiment utiliser.</h2>
            </div>
            <p className="max-w-xl text-lg leading-relaxed text-[#67706b] lg:justify-self-end">Beau, simple et pensé pour le mobile. Votre livret rassemble l’essentiel sans jamais perdre le charme ni la personnalité de votre hébergement.</p>
          </Reveal>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.08}>
                <article className={`group relative min-h-[330px] overflow-hidden rounded-[2rem] p-7 sm:p-9 ${feature.className}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${feature.accent ? 'bg-white/12' : 'bg-[#f5f0e8]'}`}>
                  <feature.icon className={`h-5 w-5 ${feature.accent ? 'text-white' : 'text-[#d96c4a]'}`} />
                </div>
                <div className="absolute inset-x-7 bottom-7 sm:inset-x-9 sm:bottom-9">
                  <p className={`text-xs font-bold uppercase tracking-[0.17em] ${feature.accent ? 'text-white/60' : 'text-[#78917c]'}`}>{feature.kicker}</p>
                  <h3 className="type-card-title mt-3 max-w-lg font-serif leading-tight">{feature.title}</h3>
                  <p className={`mt-3 max-w-xl leading-relaxed ${feature.accent ? 'text-white/70' : 'text-[#68716c]'}`}>{feature.text}</p>
                </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[1.08fr_.92fr]">
          <Reveal className="relative min-h-[620px]">
            <div className="absolute inset-y-0 left-0 w-[90%] overflow-hidden rounded-[2.5rem]">
              <Image src="/images/interior.jpg" alt="Intérieur chaleureux d’une location de vacances" fill sizes="(max-width: 1024px) 90vw, 52vw" className="object-cover" />
            </div>
            <div className="absolute bottom-8 right-0 max-w-[250px] rounded-3xl bg-[#f5f0e8] p-6 shadow-[0_20px_50px_rgba(31,41,37,.15)]">
              <Clock3 className="h-6 w-6 text-[#d96c4a]" /><p className="mt-5 font-serif text-3xl text-[#1f2925]">2 h 30</p>
              <p className="mt-1 text-sm leading-relaxed text-[#67706b]">gagnées en moyenne chaque semaine sur les questions répétitives.</p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="section-kicker">Simple dès le premier clic</p>
            <h2 className="type-section mt-4 font-serif leading-[1.05] tracking-[-0.035em] text-[#1f2925]">Votre meilleur accueil, en trois étapes.</h2>
            <div className="mt-10 divide-y divide-[#1f2925]/10">
              {steps.map(([number, title, text]) => (
                <div key={number} className="grid grid-cols-[48px_1fr] gap-4 py-7 first:pt-0">
                  <span className="font-serif text-xl italic text-[#d96c4a]">{number}</span>
                  <div><h3 className="text-xl font-semibold text-[#1f2925]">{title}</h3><p className="mt-2 leading-relaxed text-[#69716d]">{text}</p></div>
                </div>
              ))}
            </div>
            <Link href={ROUTES.REGISTER} className="mt-4 inline-flex items-center gap-2 font-semibold text-[#d96c4a]">Commencer maintenant <ChevronRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f5f0e8] px-5 pb-8 pt-20 sm:px-8 lg:pt-28">
        <Reveal className="mx-auto max-w-[1280px] rounded-[2rem] bg-[#17201c] px-6 py-14 text-center text-white sm:px-12 sm:py-16 lg:py-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e9a16f]">Votre accueil commence ici</p>
          <h2 className="mx-auto mt-5 max-w-[720px] text-balance font-serif text-[clamp(2.2rem,7vw,3.8rem)] leading-[1.04] tracking-[-0.03em]">
            Créez votre livret. <span className="italic text-[#e9a16f]">Accueillez mieux.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            Toutes les informations utiles de votre logement, réunies dans un guide simple et élégant.
          </p>
          <Link
            href={ROUTES.REGISTER}
            className="group mt-8 inline-flex h-13 items-center justify-center gap-3 rounded-full bg-[#d96c4a] px-7 text-sm font-bold text-white transition hover:bg-[#c85f40]"
          >
            Créer mon livret gratuitement
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-white/38">
            {['Sans engagement', 'Essai gratuit', 'Toujours modifiable'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-[#e9a16f]" /> {item}
              </span>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
