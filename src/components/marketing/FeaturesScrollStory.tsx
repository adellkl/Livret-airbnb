'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Building2,
  FileText,
  Globe,
  Link as LinkIcon,
  MapPin,
  Palette,
  Plus,
  Shield,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    eyebrow: 'Concevoir',
    title: 'Création du livret',
    description:
      "Composez un livret d'accueil complet en quelques minutes, sans sacrifier le soin apporté à chaque détail.",
    benefits: [
      'Modèles prédéfinis professionnels',
      'Éditeur intuitif drag & drop',
      'Sections entièrement personnalisables',
    ],
  },
  {
    icon: Palette,
    eyebrow: 'Affirmer son style',
    title: 'Personnalisation',
    description:
      "Prolongez l'identité de votre hébergement jusque dans l'expérience digitale de vos voyageurs.",
    benefits: [
      'Couleurs et thèmes personnalisables',
      'Logo et typographies',
      'Domaine personnalisé disponible',
    ],
  },
  {
    icon: LinkIcon,
    eyebrow: 'Partager',
    title: 'Lien et QR code',
    description:
      'Donnez accès aux bonnes informations, au bon moment, depuis un simple lien ou un QR code.',
    benefits: [
      'Lien unique et sécurisé par logement',
      'Copie rapide en un clic',
      'QR code téléchargeable et imprimable',
    ],
  },
  {
    icon: Shield,
    eyebrow: 'Protéger',
    title: 'Sécurité & confidentialité',
    description:
      'Gardez la maîtrise de vos contenus grâce à une infrastructure conçue pour protéger vos données.',
    benefits: [
      'Connexion HTTPS sécurisée',
      'Données hébergées en Europe',
      'Conforme au RGPD',
      'Liens sécurisés et privés',
    ],
  },
  {
    icon: Globe,
    eyebrow: 'Accueillir',
    title: 'Multilingue',
    description:
      'Faites disparaître la barrière de la langue et réservez le même accueil à tous vos voyageurs.',
    benefits: [
      'Français, anglais, espagnol, allemand',
      'Traduction automatique intégrée',
      'Langues illimitées',
    ],
  },
  {
    icon: BarChart3,
    eyebrow: 'Comprendre',
    title: 'Statistiques',
    description:
      'Découvrez ce que vos voyageurs consultent pour améliorer continuellement leur séjour.',
    benefits: [
      'Consultations en temps réel',
      'Visiteurs uniques',
      'Scans QR code',
      'Pages les plus consultées',
    ],
  },
  {
    icon: MapPin,
    eyebrow: 'Inspirer',
    title: 'Adresses locales',
    description:
      'Partagez vos meilleures adresses et transformez vos conseils en souvenirs de voyage.',
    benefits: [
      'Restaurants et cafés',
      'Transports et déplacements',
      'Activités et loisirs',
      'Commerces de proximité',
    ],
  },
  {
    icon: Building2,
    eyebrow: 'Centraliser',
    title: 'Gestion multi-logements',
    description:
      'Pilotez tous vos hébergements depuis un espace unique, clair et pensé pour grandir avec vous.',
    benefits: [
      'Plusieurs logements illimités',
      'Modèles réutilisables',
      'Utilisateurs et équipes',
      'Gestion centralisée',
    ],
  },
];

export default function FeaturesScrollStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openMobileIndexes, setOpenMobileIndexes] = useState([0]);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const mobileTriggersRef = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileActivationLockedUntilRef = useRef(0);

  useEffect(() => {
    let frame = 0;

    const updateActiveFeature = () => {
      const viewportAnchor = window.innerHeight * 0.52;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      const targets = isDesktop ? sectionsRef.current : mobileTriggersRef.current;

      targets.forEach((target, index) => {
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportAnchor);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (isDesktop) {
        setActiveIndex(closestIndex);
      } else {
        if (Date.now() < mobileActivationLockedUntilRef.current) {
          frame = 0;
          return;
        }

        setOpenMobileIndexes((current) => {
          const furthestOpenIndex = Math.max(...current);
          const nextIndex = Math.min(closestIndex, furthestOpenIndex + 1);
          if (current.includes(nextIndex)) return current;

          mobileActivationLockedUntilRef.current = Date.now() + 450;
          return [...current, nextIndex];
        });
      }
      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveFeature);
    };

    updateActiveFeature();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToFeature = (index: number) => {
    sectionsRef.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  return (
    <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
      <div className="pb-20 md:hidden">
        <div className="mb-7 flex items-end justify-between border-b border-border pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              À votre rythme
            </p>
            <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
              Touchez une fonctionnalité pour la découvrir.
            </p>
          </div>
          <span className="font-serif text-3xl italic text-primary/25">08</span>
        </div>

        <div className="divide-y divide-border border-b border-border">
          {features.map((feature, index) => {
            const isOpen = openMobileIndexes.includes(index);

            return (
              <article key={feature.title}>
                <button
                  ref={(node) => {
                    mobileTriggersRef.current[index] = node;
                  }}
                  type="button"
                  onClick={() =>
                    setOpenMobileIndexes((current) =>
                      isOpen
                        ? current.filter((openIndex) => openIndex !== index)
                        : [...current, index],
                    )
                  }
                  aria-expanded={isOpen}
                  aria-controls={`mobile-feature-${index}`}
                  className="flex w-full items-center gap-4 py-5 text-left"
                >
                  <span
                    className={`font-serif text-lg italic transition-colors duration-300 ${
                      isOpen ? 'text-primary' : 'text-muted-foreground/45'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[0.62rem] font-bold uppercase tracking-[0.18em] transition-colors ${
                        isOpen ? 'text-primary' : 'text-muted-foreground/55'
                      }`}
                    >
                      {feature.eyebrow}
                    </span>
                    <span className="mt-1 block text-lg font-semibold leading-tight tracking-[-0.02em]">
                      {feature.title}
                    </span>
                  </span>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? 'rotate-45 border-primary bg-primary text-white'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    <Plus size={17} aria-hidden="true" />
                  </span>
                </button>

                <div
                  id={`mobile-feature-${index}`}
                  className={`grid transition-[grid-template-rows] duration-500 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="pb-7 pl-10">
                      <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_18px_50px_rgba(50,38,29,0.07)]">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                            <feature.icon size={21} strokeWidth={1.8} aria-hidden="true" />
                          </div>
                          <p className="pt-1 text-base leading-relaxed text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                        <ul className="mt-6 space-y-3 border-t border-border pt-5">
                          {feature.benefits.map((benefit) => (
                            <li
                              key={benefit}
                              className="flex items-start gap-3 text-sm leading-relaxed"
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-[minmax(250px,0.78fr)_minmax(0,1.22fr)] md:gap-16 lg:gap-24">
        <aside>
          <div className="sticky top-32 flex min-h-[calc(100vh-9rem)] flex-col justify-center py-10">
            <p className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Les essentiels
            </p>
            <nav aria-label="Navigation des fonctionnalités">
              <ol className="space-y-1">
                {features.map((feature, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <li key={feature.title}>
                      <button
                        type="button"
                        onClick={() => scrollToFeature(index)}
                        aria-current={isActive ? 'step' : undefined}
                        className={`group flex w-full items-start gap-4 py-2.5 text-left transition-colors duration-300 ${
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground/55 hover:text-muted-foreground'
                        }`}
                      >
                        <span
                          className={`mt-[0.62rem] h-px shrink-0 transition-all duration-500 ${
                            isActive ? 'w-8 bg-primary' : 'w-3 bg-border group-hover:w-5'
                          }`}
                        />
                        <span
                          className={`leading-snug transition-all duration-300 ${
                            isActive ? 'text-xl font-semibold' : 'text-base'
                          }`}
                        >
                          {feature.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
            <div className="mt-9 flex items-center gap-3 pl-12 text-xs text-muted-foreground">
              <span>{String(activeIndex + 1).padStart(2, '0')}</span>
              <div className="h-px flex-1 overflow-hidden bg-border">
                <div
                  className="h-full bg-primary transition-[width] duration-500"
                  style={{ width: `${((activeIndex + 1) / features.length) * 100}%` }}
                />
              </div>
              <span>{String(features.length).padStart(2, '0')}</span>
            </div>
          </div>
        </aside>

        <div>
          {features.map((feature, index) => (
            <section
              key={feature.title}
              ref={(node) => {
                sectionsRef.current[index] = node;
              }}
              data-index={index}
              aria-labelledby={`feature-${index}`}
              className="flex min-h-[92vh] scroll-mt-40 items-center py-24"
            >
              <div
                className={`w-full rounded-[2rem] border p-7 transition-[opacity,transform,box-shadow,border-color] duration-700 sm:p-10 lg:p-14 ${
                  activeIndex === index
                    ? 'translate-y-0 border-primary/20 bg-white opacity-100 shadow-[0_32px_90px_rgba(50,38,29,0.10)]'
                    : 'translate-y-5 border-border/60 bg-white/55 opacity-45'
                }`}
              >
                <div className="mb-12 flex items-start justify-between gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_10px_30px_rgba(216,91,36,0.25)]">
                    <feature.icon size={25} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <span className="font-serif text-5xl italic text-primary/20">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {feature.eyebrow}
                </p>
                <h2
                  id={`feature-${index}`}
                  className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:text-5xl"
                >
                  {feature.title}
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  {feature.description}
                </p>

                <ul className="mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
