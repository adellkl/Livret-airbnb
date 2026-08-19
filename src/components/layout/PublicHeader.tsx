'use client';

import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/config/routes';
import BrandMark from '@/components/layout/BrandMark';

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="font-serif text-xl font-semibold tracking-[-0.02em] text-[#1f2925]">
        livret d’accueil
      </span>
    </span>
  );
}

const mobileLinks = [
  [ROUTES.HOME, 'Accueil'],
  [ROUTES.FEATURES, 'Fonctionnalités'],
  [ROUTES.PRICING, 'Tarifs'],
  [ROUTES.LOGIN, 'Se connecter'],
] as const;

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : previousOverflow;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#1f2925]/8 bg-[#f5f0e8]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-20">
          <Link href={ROUTES.HOME} aria-label="Accueil">
            <Brand />
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
            <Link href={ROUTES.FEATURES} className="text-sm font-medium text-[#5f6863] transition hover:text-[#1f2925]">
              Fonctionnalités
            </Link>
            <Link href={ROUTES.PRICING} className="text-sm font-medium text-[#5f6863] transition hover:text-[#1f2925]">
              Tarifs
            </Link>
            <Link href={ROUTES.LOGIN} className="text-sm font-medium text-[#5f6863] transition hover:text-[#1f2925]">
              Se connecter
            </Link>
            <Link href={ROUTES.REGISTER} className="rounded-full bg-[#1f2925] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#324139]">
              Créer mon livret
            </Link>
          </nav>
          <button
            type="button"
            className="rounded-full border border-[#1f2925]/10 p-2.5 text-[#1f2925] transition hover:bg-white/70 md:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      <div
        className={`fixed inset-0 z-[80] md:hidden ${mobileMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none delay-500'}`}
        aria-hidden={!mobileMenuOpen}
      >
        <button
          type="button"
          aria-label="Fermer le menu"
          className={`menu-backdrop absolute inset-0 bg-[#111814]/45 backdrop-blur-md transition-all duration-500 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        <aside
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
          className={`menu-drawer absolute right-0 top-0 flex h-dvh w-[88%] max-w-[430px] flex-col overflow-hidden bg-[#f5f0e8] text-[#1f2925] shadow-[-30px_0_90px_rgba(13,19,16,.28)] transition-transform duration-500 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#1f2925]/6" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border border-[#1f2925]/6" />

          <div className="relative flex h-[76px] shrink-0 items-center justify-between border-b border-[#1f2925]/8 px-5">
            <Link href={ROUTES.HOME} aria-label="Accueil" onClick={() => setMobileMenuOpen(false)}>
              <Brand />
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1f2925]/12 text-[#1f2925]/70 transition hover:rotate-90 hover:bg-white/70 hover:text-[#1f2925]"
              aria-label="Fermer le menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="relative flex-1 px-6 pb-5 pt-8" aria-label="Navigation mobile">
            <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#e9a16f]">Navigation</p>
            <div className="divide-y divide-[#1f2925]/10">
              {mobileLinks.map(([href, label], index) => (
                <Link
                  key={href}
                  href={href}
                  className="menu-link group flex items-center justify-between py-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-serif text-[11px] italic text-[#e9a16f]/65">0{index + 1}</span>
                    <span className="font-serif text-[clamp(1.3rem,5.5vw,1.65rem)] leading-none text-[#1f2925]/88 transition group-hover:translate-x-1 group-hover:text-[#1f2925]">
                      {label}
                    </span>
                  </span>
                  <span className="flex h-7 w-7 translate-x-2 items-center justify-center rounded-full border border-[#1f2925]/10 text-xs text-[#d96c4a] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">↗</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="relative shrink-0 border-t border-[#1f2925]/8 bg-[#eee8df] p-5 text-[#1f2925]">
            <p className="mb-3 text-xs leading-relaxed text-[#68716c]">
              Votre prochain accueil peut déjà être plus simple.
            </p>
            <Link
              href={ROUTES.REGISTER}
              className="group flex h-12 items-center justify-between rounded-full bg-[#d96c4a] px-5 text-sm font-semibold text-white transition hover:bg-[#c85f40]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Créer mon livret
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <p className="mt-3 text-center text-[9px] uppercase tracking-[0.14em] text-[#7e8581]">Gratuit · Sans carte bancaire</p>
          </div>
        </aside>
      </div>
    </>
  );
}
