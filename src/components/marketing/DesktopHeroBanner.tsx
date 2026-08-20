import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  HeartHandshake,
  KeyRound,
  MapPin,
  MessageCircleMore,
  Star,
  UtensilsCrossed,
  Wifi,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';

const guideItems = [
  { icon: KeyRound, label: 'Mon arrivée' },
  { icon: Wifi, label: 'Wi-Fi' },
  { icon: UtensilsCrossed, label: 'À proximité' },
  { icon: MapPin, label: 'Bonnes adresses' },
];

const marqueeItems = [
  'Sans application',
  'Toujours à jour',
  'Accès privé',
  'Pensé pour le mobile',
  'Prêt en 10 minutes',
];

function DesktopPhonePreview() {
  return (
    <div className="relative w-[270px] rounded-[3rem] border-[7px] border-[#242320] bg-[#242320] p-1 shadow-[0_32px_80px_rgba(31,41,37,.25)] xl:w-[286px]">
      <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-[#242320]" />
      <div className="overflow-hidden rounded-[2.45rem] bg-[#fbf8f1]">
        <div className="relative h-48 xl:h-52">
          <Image
            src="/images/apartment.jpg"
            alt=""
            fill
            sizes="286px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
          <div className="absolute inset-x-5 bottom-5 text-white">
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/70">
              Bienvenue à
            </p>
            <p className="mt-1 font-serif text-2xl">Casa Levante</p>
          </div>
        </div>

        <div className="p-4 text-[#1f2925]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold">Tout pour votre séjour</p>
            <span className="rounded-lg bg-[#f4e7e1] px-2 py-1 text-[7px] font-bold text-[#b4583c]">
              À jour
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {guideItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white p-3 shadow-[0_4px_16px_rgba(31,41,37,.06)]"
              >
                <item.icon className="mb-2 h-4 w-4 text-[#d96c4a]" />
                <span className="text-[9px] font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#e7e4d6] px-3 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d96c4a] text-white">
              <MessageCircleMore className="h-3.5 w-3.5" />
            </span>
            <span>
              <span className="block text-[9px] font-semibold">Besoin d’aide ?</span>
              <span className="block text-[8px] text-[#67716c]">
                Marie répond en 5 min
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesktopHeroBanner() {
  return (
    <section className="relative hidden overflow-hidden bg-[#f5f0e8] lg:block">
      <div className="mx-auto grid min-h-[760px] max-w-[1440px] grid-cols-[.9fr_1.1fr] items-center gap-14 px-12 pb-20 pt-14 xl:px-20">
        <div className="relative z-10 max-w-[650px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1f2925]/10 bg-white/65 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#516358]">
            <HeartHandshake className="h-3.5 w-3.5 text-[#d96c4a]" />
            L’attention qui change tout
          </div>

          <h1 className="font-serif text-[clamp(4.5rem,6.4vw,6.8rem)] leading-[0.9] tracking-[-0.055em] text-[#1f2925]">
            Un accueil mémorable,{' '}
            <span className="italic text-[#d96c4a]">avant même</span> l’arrivée.
          </h1>

          <p className="mt-7 max-w-[590px] text-lg leading-relaxed text-[#5f6863]">
            Créez un livret d’accueil digital aussi soigné que votre logement.
            Moins de questions pour vous, plus de sérénité pour vos voyageurs.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Link
              href={ROUTES.REGISTER}
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#d96c4a] px-7 font-semibold text-white shadow-[0_12px_32px_rgba(217,108,74,.24)] transition hover:-translate-y-0.5 hover:bg-[#c85f40]"
            >
              Créer mon livret gratuitement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#apercu"
              className="inline-flex h-14 items-center justify-center rounded-full border border-[#1f2925]/15 bg-white/55 px-7 font-semibold text-[#1f2925] transition hover:bg-white"
            >
              Découvrir l’expérience
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#66706b]">
            {['Sans carte bancaire', 'Prêt en 10 minutes', 'Toujours modifiable'].map(
              (item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#d96c4a]" />
                  {item}
                </span>
              )
            )}
          </div>
        </div>

        <div className="relative min-h-[620px]">
          <div className="absolute inset-y-0 right-0 w-[88%] overflow-hidden rounded-[2.5rem]">
            <Image
              src="/images/hero-villa.jpg"
              alt="Belle maison de vacances contemporaine"
              fill
              priority
              sizes="54vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f2925]/38 via-transparent to-white/5" />
          </div>

          <div className="absolute bottom-5 left-0 z-10 xl:left-6">
            <DesktopPhonePreview />
          </div>

          <div className="absolute right-7 top-7 z-10 rounded-2xl border border-white/40 bg-white/88 px-4 py-3 shadow-[0_14px_40px_rgba(31,41,37,.14)] backdrop-blur-md">
            <div className="flex items-center gap-3 text-[#1f2925]">
              <div className="flex -space-x-1.5">
                {[
                  ['E', '#d96c4a'],
                  ['M', '#8c7b70'],
                  ['J', '#1f2925'],
                ].map(([letter, color]) => (
                  <span
                    key={letter}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {letter}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 text-[#d96c4a]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-3 w-3 fill-current" />
                  ))}
                </div>
                <p className="mt-1 text-[10px] font-semibold">
                  Des voyageurs bien accueillis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex h-11 items-center overflow-hidden border-t border-[#1f2925]/8 bg-white/35 text-[9px] font-bold uppercase tracking-[0.22em] text-[#69716d] backdrop-blur-sm">
        <div className="flex min-w-max animate-[marquee_28s_linear_infinite] items-center gap-10 px-10">
          {Array.from({ length: 2 }).flatMap((_, groupIndex) =>
            marqueeItems.map((label) => (
              <span key={`${groupIndex}-${label}`} className="flex items-center gap-10">
                {label}
                <span className="h-1 w-1 rounded-full bg-[#d96c4a]" />
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
