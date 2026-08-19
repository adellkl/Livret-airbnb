import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import BrandMark from '@/components/layout/BrandMark';

const columns = [
  {
    title: 'Produit',
    links: [
      ['Fonctionnalités', ROUTES.FEATURES],
      ['Tarifs', ROUTES.PRICING],
      ['Créer mon livret', ROUTES.REGISTER],
    ],
  },
  {
    title: 'Votre espace',
    links: [
      ['Se connecter', ROUTES.LOGIN],
      ['Créer un compte', ROUTES.REGISTER],
      ['Voir les tarifs', ROUTES.PRICING],
    ],
  },
  {
    title: 'Légal',
    links: [
      ['Mentions légales', ROUTES.LEGAL],
      ['Confidentialité', ROUTES.PRIVACY],
      ['Conditions d’utilisation', ROUTES.TERMS],
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#f5f0e8] px-5 pb-6 pt-8 text-white sm:px-8">
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-[#d96c4a]/10 blur-[100px]" />
      <div className="mx-auto max-w-[1280px]">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#17201c] px-6 pb-7 pt-14 sm:px-10 lg:px-14 lg:pt-16">
          <div className="absolute -right-32 -top-44 h-96 w-96 rounded-full border border-white/5" />
          <div className="absolute -right-14 -top-28 h-64 w-64 rounded-full border border-white/5" />

          <div className="relative grid gap-14 border-b border-white/10 pb-14 lg:grid-cols-[1.55fr_2fr] lg:gap-24">
            <div>
              <Link href={ROUTES.HOME} className="inline-flex items-center gap-3">
                <BrandMark className="h-11 w-11 drop-shadow-[0_8px_12px_rgba(217,108,74,.25)]" />
                <span className="font-serif text-2xl font-semibold">livret d’accueil</span>
              </Link>
              <p className="mt-7 max-w-md font-serif text-3xl leading-[1.15] text-white/90 sm:text-4xl">
                Chaque séjour mérite une <span className="italic text-[#e9a16f]">belle arrivée.</span>
              </p>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/45">
                Le guide digital imaginé en France pour les hôtes qui aiment recevoir avec attention.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <a href="#" aria-label="Instagram" className="footer-social flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-[10px] font-bold uppercase text-white/60 transition hover:border-[#e9a16f]/50 hover:bg-[#e9a16f]/10 hover:text-[#e9a16f]">ig</a>
                <a href="#" aria-label="LinkedIn" className="footer-social flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-[10px] font-bold uppercase text-white/60 transition hover:border-[#e9a16f]/50 hover:bg-[#e9a16f]/10 hover:text-[#e9a16f]">in</a>
                <a href="mailto:bonjour@livret-accueil.fr" className="ml-2 text-sm text-white/50 underline decoration-white/15 underline-offset-4 transition hover:text-white">
                  bonjour@livret-accueil.fr
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3">
              {columns.map((column) => (
                <div key={column.title}>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e9a16f]">{column.title}</h2>
                  <ul className="mt-6 space-y-4">
                    {column.links.map(([label, href]) => (
                      <li key={`${column.title}-${href}`}>
                        <Link href={href} className="group inline-flex items-center gap-1.5 text-sm text-white/55 transition hover:text-white">
                          {label}
                          <span className="translate-x-[-4px] text-[#e9a16f] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">↗</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-4 pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Livret d’accueil. Tous droits réservés.</p>
            <div className="flex flex-wrap items-center gap-5">
              <span className="flex items-center gap-2 text-white/40">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#84a88d] opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#84a88d]" />
                </span>
                Tous les services sont opérationnels
              </span>
              <span>France · Français</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
