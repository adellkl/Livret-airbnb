import Image from 'next/image';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { ROUTES } from '@/config/routes';

interface AuthShellProps {
  children: React.ReactNode;
  mode: 'login' | 'register';
}

function AuthBrand({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d96c4a] font-serif text-xl italic text-white shadow-[0_8px_24px_rgba(217,108,74,.22)]">L</span>
      <span className={`font-serif text-xl font-semibold tracking-[-0.02em] ${light ? 'text-white' : 'text-[#1f2925]'}`}>
        livret d’accueil
      </span>
    </span>
  );
}

export default function AuthShell({ children, mode }: AuthShellProps) {
  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_82%_12%,rgba(217,108,74,.08),transparent_26%),#f5f0e8] p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1540px] lg:grid-cols-[.88fr_1.12fr] lg:gap-5">
        <aside className="auth-visual sticky top-5 hidden h-[calc(100vh-40px)] min-h-[700px] overflow-hidden rounded-[2.5rem] lg:block">
          <Image
            src="/images/interior.jpg"
            alt="Intérieur accueillant d’une location de vacances"
            fill
            priority
            sizes="42vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#17201c]/45 via-[#17201c]/25 to-[#17201c]/95" />
          <div className="auth-visual-grid absolute inset-0 opacity-35" />
          <div className="absolute -right-32 -top-28 h-80 w-80 rounded-full border border-white/15" />
          <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full border border-white/15" />

          <div className="relative flex h-full flex-col justify-between p-8 xl:p-11">
            <Link href={ROUTES.HOME} aria-label="Retour à l’accueil" className="w-fit">
              <AuthBrand light />
            </Link>

            <div className="max-w-[590px] text-white">
              <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.19em] text-white/80 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#efad82]" />
                Pensé pour les hôtes attentionnés
              </div>
              <h1 className="text-balance font-serif text-[clamp(3.2rem,5.1vw,5.4rem)] leading-[.94] tracking-[-0.045em]">
                {isLogin ? (
                  <>Heureux de vous <span className="italic text-[#efad82]">revoir.</span></>
                ) : (
                  <>Votre plus bel accueil <span className="italic text-[#efad82]">commence ici.</span></>
                )}
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/68">
                {isLogin
                  ? 'Retrouvez vos logements, vos livrets et toutes les informations qui rendent chaque séjour plus simple.'
                  : 'Créez des livrets aussi soignés que vos logements et offrez une arrivée fluide à chaque voyageur.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {['Simple à créer', 'Toujours à jour', 'Pensé pour le mobile'].map((item) => (
                  <span key={item} className="flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3.5 py-2 text-xs font-semibold text-white/72 backdrop-blur-md">
                    <Check className="h-3.5 w-3.5 text-[#efad82]" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/12 pt-6 text-xs text-white/42">
              <span>Accueil digital · Expérience mémorable</span>
              <span>Conçu en France</span>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="flex h-[72px] items-center justify-between px-2 sm:px-5 lg:hidden">
            <Link href={ROUTES.HOME} aria-label="Retour à l’accueil"><AuthBrand /></Link>
            <Link
              href={isLogin ? ROUTES.REGISTER : ROUTES.LOGIN}
              className="rounded-full border border-[#1f2925]/12 bg-white/55 px-4 py-2 text-xs font-semibold text-[#1f2925]"
            >
              {isLogin ? 'Créer un compte' : 'Se connecter'}
            </Link>
          </div>

          <div className="flex flex-1 items-start justify-center px-0 py-3 sm:px-5 sm:py-6 lg:items-center lg:px-10 xl:px-16">
            {children}
          </div>

          <div className="hidden items-center justify-center gap-5 pb-2 text-[11px] text-[#78807b] lg:flex">
            <Link href={ROUTES.PRIVACY} className="hover:text-[#1f2925]">Confidentialité</Link>
            <span>•</span>
            <Link href={ROUTES.TERMS} className="hover:text-[#1f2925]">Conditions d’utilisation</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
