import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

interface PricingCardProps {
  title: string;
  audience: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  priceNote: string;
  valueNote: string;
  popular?: boolean;
  ctaText: string;
  ctaHref: string;
  icon: typeof Sparkles;
}

export default function PricingCard({
  title,
  audience,
  price,
  period,
  description,
  features,
  priceNote,
  valueNote,
  popular,
  ctaText,
  ctaHref,
  icon: Icon,
}: PricingCardProps) {
  return (
    <article
      className={`relative flex min-h-full flex-col overflow-hidden rounded-[2rem] border p-6 sm:p-7 ${
        popular
          ? 'order-first border-[#24332d] bg-[#1f2925] text-white shadow-[0_30px_80px_rgba(31,41,37,.22)] md:order-none md:-translate-y-4'
          : 'border-[#1f2925]/9 bg-white text-[#1f2925] shadow-[0_18px_55px_rgba(31,41,37,.07)]'
      }`}
    >
      {popular && (
        <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#d96c4a] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
          Le choix des hôtes
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
              popular ? 'text-[#a9c0b4]' : 'text-[#78917c]'
            }`}
          >
            {audience}
          </p>
          <h3 className="mt-2 font-serif text-3xl leading-none">{title}</h3>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            popular
              ? 'bg-white/10 text-[#f3aa8f]'
              : 'bg-[#f7eee8] text-[#d96c4a]'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p
        className={`mt-5 min-h-12 text-sm leading-6 ${
          popular ? 'text-white/68' : 'text-[#69716d]'
        }`}
      >
        {description}
      </p>

      <div className="mt-6 flex items-end gap-1.5">
        <span className="font-serif text-5xl leading-none tracking-[-0.05em]">
          {price}
        </span>
        <span
          className={`pb-1 text-sm ${
            popular ? 'text-white/58' : 'text-[#737c77]'
          }`}
        >
          {period}
        </span>
      </div>
      <p
        className={`mt-2 text-[10px] font-semibold ${
          popular ? 'text-white/52' : 'text-[#89918d]'
        }`}
      >
        {priceNote}
      </p>

      <div
        className={`mt-6 rounded-2xl border px-4 py-3 ${
          popular
            ? 'border-white/10 bg-white/[0.06]'
            : 'border-[#d96c4a]/12 bg-[#fbf4ef]'
        }`}
      >
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.13em] ${
            popular ? 'text-[#f3aa8f]' : 'text-[#c45f40]'
          }`}
        >
          Votre bénéfice
        </p>
        <p className="mt-1.5 text-sm font-semibold leading-5">{valueNote}</p>
      </div>

      <ul className="mt-7 space-y-3.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                popular
                  ? 'bg-[#d96c4a] text-white'
                  : 'bg-[#e7f1ec] text-[#3f8171]'
              }`}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className={popular ? 'text-white/82' : 'text-[#4f5a54]'}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
          popular
            ? 'bg-[#d96c4a] text-white shadow-[0_12px_25px_rgba(217,108,74,.25)] hover:bg-[#c85f40]'
            : 'bg-[#1f2925] text-white hover:bg-[#2e3b35]'
        }`}
      >
        {ctaText}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
