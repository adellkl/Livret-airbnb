'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  KeyRound,
  Link2,
  MapPin,
  MessageCircle,
  PencilLine,
  QrCode,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Wifi,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    label: 'Créez votre guide',
    description: 'Les informations utiles, réunies dans un livret à votre image.',
    icon: PencilLine,
    stageLabel: 'Votre logement, à votre image',
    stageNote: 'Arrivée, Wi-Fi, bonnes adresses : tout est prêt.',
  },
  {
    number: '02',
    label: 'Partagez en un geste',
    description: 'Un lien privé ou un QR code, sans application à installer.',
    icon: Link2,
    stageLabel: 'Un lien. Et c’est partagé.',
    stageNote: 'Envoyez votre guide avant l’arrivée ou affichez le QR code.',
  },
  {
    number: '03',
    label: 'Échangez simplement',
    description: 'Gardez les messages du séjour au même endroit.',
    icon: MessageCircle,
    stageLabel: 'Toujours là, sans être dérangé',
    stageNote: 'Les réponses courantes sont déjà dans le livret.',
  },
];

function GuideScreen() {
  const sections = [
    { icon: KeyRound, label: 'Arrivée & accès', detail: 'À partir de 15 h' },
    { icon: Wifi, label: 'Le Wi-Fi', detail: 'Réseau et mot de passe' },
    { icon: MapPin, label: 'Bonnes adresses', detail: 'Nos favoris du quartier' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="rounded-2xl bg-[#e9eee8] px-3 py-3 md:px-4 md:py-4">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#78847b]">Bienvenue à</p>
        <p className="mt-1 font-serif text-[22px] leading-[1.05] tracking-[-.03em] text-[#202c27] md:text-[25px]">Casa Levante</p>
        <p className="mt-1.5 text-[9px] text-[#68756d] md:mt-2 md:text-[10px]">Votre guide pour un séjour serein.</p>
      </div>
      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-center gap-1.5 md:mt-4 md:gap-2">
        {sections.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-center gap-2.5 rounded-xl border border-[#eeeae4] bg-white px-2.5 py-2 md:gap-3 md:px-3 md:py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#faeee8] text-[#d96c4a] md:h-8 md:w-8"><Icon size={14} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-semibold text-[#26332d] md:text-[10px]">{label}</span>
              <span className="mt-0.5 block truncate text-[8px] text-[#89928b] md:text-[9px]">{detail}</span>
            </span>
            <ArrowRight size={12} className="text-[#9da69f] md:h-[13px] md:w-[13px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 md:gap-0">
      <div className="shrink-0 rounded-xl bg-[#19344a] px-3 py-3 text-white md:rounded-2xl md:px-4 md:py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[#f2a183] md:h-9 md:w-9 md:rounded-xl"><Link2 size={15} className="md:h-[17px] md:w-[17px]" /></span>
        <p className="mt-2.5 font-serif text-[20px] leading-[1.05] md:mt-4 md:text-[24px] md:leading-tight">Votre guide est prêt.</p>
        <p className="mt-1 text-[9px] leading-[1.45] text-white/65 md:text-[10px] md:leading-4">Partagez-le avant l’arrivée de vos voyageurs.</p>
      </div>
      <div className="shrink-0 rounded-lg border border-[#eeeae4] bg-white p-2 md:mt-3 md:rounded-xl md:p-3">
        <p className="text-[8px] font-bold uppercase tracking-[.1em] text-[#89928b] md:text-[9px] md:tracking-[.13em]">Lien du logement</p>
        <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-[#f7f5f0] px-2 py-1.5 md:mt-2 md:gap-2 md:px-2.5 md:py-2">
          <span className="min-w-0 flex-1 truncate text-[8px] text-[#536159] md:text-[9px]">monlivret.fr/maison/casa-levante</span>
          <span className="shrink-0 rounded-md bg-[#e56f4d] px-1.5 py-1 text-[7px] font-bold text-white md:px-2 md:text-[8px]">Copier</span>
        </div>
      </div>
      <div className="mt-auto flex shrink-0 items-center gap-2 rounded-lg bg-[#edf5ef] p-2 md:gap-3 md:rounded-xl md:p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#19344a] md:h-12 md:w-12"><QrCode size={27} className="md:h-[34px] md:w-[34px]" strokeWidth={1.5} /></span>
        <span className="min-w-0"><span className="block text-[9px] font-semibold leading-tight text-[#294b3d] md:text-[10px]">Ou scannez le QR code</span><span className="mt-0.5 block text-[8px] leading-[1.35] text-[#718078] md:mt-1 md:text-[9px] md:leading-4">À afficher dans le logement.</span></span>
      </div>
    </div>
  );
}

function MessagesScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-[#eeeae4] pb-2 md:pb-3">
        <div><p className="text-[8px] font-bold uppercase tracking-[.13em] text-[#89928b] md:text-[9px] md:tracking-[.15em]">Messages du séjour</p><p className="mt-1 text-[11px] font-semibold text-[#25332d] md:text-xs">Camille Martin</p></div>
        <span className="flex items-center gap-1 rounded-full bg-[#eaf4ee] px-1.5 py-1 text-[7px] font-semibold text-[#38775f] md:gap-1.5 md:px-2 md:text-[8px]"><span className="h-1.5 w-1.5 rounded-full bg-[#55aa82]" />En ligne</span>
      </div>
      <div className="my-2 flex min-h-0 flex-1 flex-col justify-center gap-2 md:my-4 md:gap-3">
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#f3f1ec] px-2.5 py-2 text-[9px] leading-[1.45] text-[#526057] md:px-3 md:py-2.5 md:text-[10px] md:leading-4">Merci, nous avons bien trouvé le logement !</div>
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#19344a] px-2.5 py-2 text-[9px] leading-[1.45] text-white md:px-3 md:py-2.5 md:text-[10px] md:leading-4">Parfait, bon séjour à vous deux !</div>
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#f3f1ec] px-2.5 py-2 text-[9px] leading-[1.45] text-[#526057] md:px-3 md:py-2.5 md:text-[10px] md:leading-4">Où peut-on trouver les bonnes adresses ?</div>
      </div>
      <div className="mt-auto flex shrink-0 items-center gap-2 rounded-xl border border-[#e9e5dd] px-2.5 py-2 text-[8px] text-[#9aa19c] md:px-3 md:py-2.5 md:text-[9px]"><span className="flex-1">Écrire un message…</span><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e56f4d] text-white md:h-7 md:w-7"><Send size={11} /></span></div>
    </div>
  );
}

function GuestPreview({ activeIndex }: { activeIndex: number }) {
  return (
    <div key={activeIndex} className="min-h-0 flex-1 animate-[fadeIn_450ms_ease-out_both]">
      {activeIndex === 0 ? <GuideScreen /> : null}
      {activeIndex === 1 ? <ShareScreen /> : null}
      {activeIndex === 2 ? <MessagesScreen /> : null}
    </div>
  );
}

export default function SaasScrollStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isStoryInView, setIsStoryInView] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const noteRef = useRef<HTMLDivElement | null>(null);
  const active = steps[activeIndex];
  const StageIcon = active.icon;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsStoryInView(entry.isIntersecting);
    }, { threshold: 0.25 });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isStoryInView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timeout = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % steps.length);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [isStoryInView, activeIndex]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const updateParallax = () => {
      frame = 0;
      const bounds = section.getBoundingClientRect();
      const travel = window.innerHeight + bounds.height;
      const progress = Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / travel));
      const shift = (progress - 0.5) * 70;
      const phoneShift = -shift * 0.38;
      const phoneX = window.matchMedia('(max-width: 767px)').matches ? '-50%' : '0';

      if (imageRef.current) imageRef.current.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.12)`;
      if (phoneRef.current) phoneRef.current.style.transform = `translate3d(${phoneX}, ${phoneShift.toFixed(1)}px, 0)`;
      if (noteRef.current) noteRef.current.style.transform = `translate3d(0, ${(shift * 0.72).toFixed(1)}px, 0)`;
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden bg-[#f7f5f0] px-5 py-20 sm:px-8 sm:py-24 lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-16 h-80 w-80 rounded-full bg-[#e7d8ca]/30 blur-3xl" />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="grid items-end gap-6 md:grid-cols-[1.12fr_.88fr] md:gap-12">
          <div>
            <p className="section-kicker">Le parcours Mon Livret</p>
            <h2 className="type-section mt-4 max-w-3xl text-balance font-serif leading-[.98] tracking-[-.045em] text-[#1f2925]">Un accueil plus simple, du premier clic au dernier jour.</h2>
          </div>
          <p className="max-w-md pb-1 text-base leading-7 text-[#68736d] sm:text-lg">Préparez un guide à votre image, partagez-le en un instant et gardez les échanges au même endroit.</p>
        </div>

        <div className="mt-10 grid items-stretch gap-4 md:grid-cols-[.76fr_1.24fr] lg:mt-12">
          <aside className="flex flex-col rounded-[1.5rem] border border-[#e7e1d8] bg-[#fffdf9] p-4 shadow-[0_18px_48px_rgba(35,49,42,.06)] sm:rounded-[2rem] sm:p-5 md:p-7 lg:p-8">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[.17em] text-[#88918a] md:text-[10px]">En trois étapes</p>
              <span className="rounded-full bg-[#f5eee8] px-2.5 py-1 text-[10px] font-bold text-[#b75f43]">{active.number} / 03</span>
            </div>

            <nav aria-label="Les étapes de votre livret" className="mt-3 grid grid-cols-3 gap-2 md:mt-5 md:block md:space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeIndex === index;

                return (
                  <button
                    key={step.number}
                    type="button"
                    aria-pressed={isActive}
                    aria-controls="mon-livret-preview"
                    onClick={() => setActiveIndex(index)}
                    className={'group relative flex min-w-0 w-full flex-col items-start gap-2 rounded-xl border p-2.5 text-left transition duration-300 sm:p-3 md:flex-row md:items-start md:gap-3.5 md:rounded-2xl md:p-4 ' + (isActive ? 'border-[#edc8b8] bg-[#fbf2ed] shadow-[0_8px_20px_rgba(185,105,77,.08)]' : 'border-transparent hover:border-[#ece7de] hover:bg-[#f8f6f1]')}
                  >
                    <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition md:mt-0.5 md:h-9 md:w-9 md:rounded-xl ' + (isActive ? 'bg-[#df7654] text-white' : 'bg-[#f1eee7] text-[#718078] group-hover:text-[#d96c4a]')}><Icon size={15} className="md:h-4 md:w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={'text-[10px] font-semibold leading-tight sm:text-[11px] md:text-sm ' + (isActive ? 'text-[#26332d]' : 'text-[#67736c]')}>{step.label}</span>
                        {isActive ? <ArrowRight size={14} className="absolute right-2 top-2 shrink-0 text-[#d96c4a] md:static md:size-[15px]" /> : null}
                      </span>
                      <span className="mt-1 hidden text-xs leading-[1.55] text-[#818b84] md:block">{step.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-3 flex items-center gap-2 border-t border-[#eee9e1] pt-3 text-[10px] leading-4 text-[#65736a] md:mt-auto md:gap-3 md:pt-5 md:text-xs md:leading-5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf3ed] text-[#448267] md:h-9 md:w-9"><ShieldCheck size={15} className="md:h-[17px] md:w-[17px]" /></span>
              <span>Aucun compte ni téléchargement pour vos voyageurs.</span>
            </div>

            <div className="mt-3 flex items-center gap-2 md:mt-4" aria-label="L’étape suivante commence dans 3 secondes">
              <div aria-hidden="true" className="h-1 flex-1 overflow-hidden rounded-full bg-[#eee9e1]">
                <span key={`${activeIndex}-${isStoryInView}`} className={'block h-full w-full origin-left rounded-full bg-[#df7654] [transform:scaleX(0)] ' + (isStoryInView ? 'animate-[storyProgress_3s_linear_forwards]' : '')} />
              </div>
              <span className="text-[9px] font-medium tabular-nums text-[#89928b]">3 s</span>
            </div>
          </aside>

          <div id="mon-livret-preview" role="region" aria-label={`Aperçu : ${active.label}`} className="relative min-h-[470px] overflow-hidden rounded-[1.5rem] bg-[#1a2e34] shadow-[0_24px_60px_rgba(25,41,37,.18)] sm:rounded-[2rem] md:min-h-[570px]">
            <div ref={imageRef} aria-hidden="true" className="absolute -inset-8">
              <Image src="/images/interior.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 65vw" className="object-cover" />
            </div>
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#122329]/65 via-[#122329]/24 to-[#122329]/5" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#102126]/55 via-transparent to-[#102126]/15" />

            <div className="absolute left-5 top-5 z-10 hidden items-center gap-2 rounded-full border border-white/20 bg-[#11262d]/40 px-3 py-2 text-[9px] font-semibold uppercase tracking-[.12em] text-white/90 backdrop-blur-md lg:left-7 lg:top-7 lg:flex">
              <Sparkles size={13} className="text-[#f2a183]" /> Un guide qui vous ressemble
            </div>

            <div ref={noteRef} className="absolute left-5 top-[28%] z-20 hidden w-[210px] rounded-2xl border border-white/55 bg-[#fffdf9]/95 p-4 shadow-[0_18px_44px_rgba(18,32,31,.2)] backdrop-blur-md lg:left-9 lg:block lg:w-[230px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faeee8] text-[#d96c4a]"><StageIcon size={17} /></span>
              <p className="mt-3 text-[9px] font-bold uppercase tracking-[.14em] text-[#a06954]">{active.number} — {active.label}</p>
              <p className="mt-1.5 font-serif text-lg leading-tight text-[#1f2925]">{active.stageLabel}</p>
              <p className="mt-1.5 text-[11px] leading-[1.5] text-[#6e7871]">{active.stageNote}</p>
            </div>

            <div ref={phoneRef} className="absolute left-1/2 right-auto top-3 z-30 h-[440px] w-[210px] -translate-x-1/2 md:left-auto md:right-8 md:top-5 md:h-[520px] md:w-[252px] md:translate-x-0 lg:right-[8%] lg:w-[264px]">
              <div className="relative h-full rounded-[2.6rem] border-[6px] border-[#1a1d1b] bg-[#1a1d1b] p-1.5 pb-4 shadow-[0_28px_70px_rgba(8,18,18,.42)]">
                <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] bg-[#fffdf9] px-3 pb-3 pt-2.5 md:px-4 md:pb-5 md:pt-3">
                  <div className="mb-2 flex shrink-0 items-center justify-between px-1 text-[#536159] md:mb-4">
                    <span className="text-[9px] font-bold">9:41</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-2 rounded-sm bg-[#536159]" /><span className="h-2 w-3 rounded-[2px] border border-[#536159] p-[1px]"><span className="block h-full w-2/3 rounded-[1px] bg-[#536159]" /></span></span>
                  </div>
                  <div className="mb-2 flex shrink-0 items-center gap-2 border-b border-[#eeeae4] pb-2 md:mb-3 md:pb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#19344a] text-[#f2a183]"><BookOpen size={14} /></span>
                    <span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#536159]">Mon Livret</span>
                    <span className="ml-auto flex items-center gap-1 text-[8px] font-medium text-[#78917f]"><span className="h-1.5 w-1.5 rounded-full bg-[#72bd99]" />En ligne</span>
                  </div>
                  <GuestPreview activeIndex={activeIndex} />
                  <div className="mt-auto flex shrink-0 items-center justify-center gap-1.5 border-t border-[#eeeae4] pt-2 text-[8px] text-[#849087] md:pt-3"><Clock3 size={10} /> Toujours à jour</div>
                </div>
                <div aria-hidden="true" className="absolute bottom-[5px] left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-white/75" />
              </div>
            </div>

            <div className="absolute bottom-6 left-5 z-10 hidden items-center gap-2.5 rounded-full border border-white/20 bg-[#11262d]/45 px-3 py-2 text-[10px] font-medium text-white/90 backdrop-blur-md lg:bottom-7 lg:left-7 lg:flex">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e98060] text-white"><Star size={13} fill="currentColor" /></span>
              <span>Un séjour qui commence bien</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-medium text-[#89928b]">
          <Check size={13} className="text-[#4b8a6c]" /> Un guide clair, accessible sur tous les téléphones.
        </div>
      </div>
    </section>
  );
}
