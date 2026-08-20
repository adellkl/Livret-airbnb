'use client';

import Link from 'next/link';
import { Crown, LockKeyhole } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useSubscription } from '@/hooks/useSubscription';

type ProFeatureGateProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function ProFeatureGate({ title, description, children }: ProFeatureGateProps) {
  const { isLoading, isPaid } = useSubscription();
  if (isLoading || isPaid) return <>{children}</>;

  return (
    <section className="flex min-h-72 items-center justify-center rounded-[2rem] border border-[#ead9ce] bg-[linear-gradient(135deg,#fff_0%,#fbf2eb_100%)] p-7 text-center shadow-[0_16px_38px_rgba(61,44,31,.06)]">
      <div className="max-w-md">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6e5db] text-[#d85b24]"><LockKeyhole size={21} /></span>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d85b24]"><Crown size={13} /> Disponible avec Pro</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#24292c]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[#77736f]">{description}</p>
        <Link href={ROUTES.PRICING} className="mt-6 inline-flex rounded-xl bg-[#17232c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#293d46]">Découvrir Pro</Link>
      </div>
    </section>
  );
}
