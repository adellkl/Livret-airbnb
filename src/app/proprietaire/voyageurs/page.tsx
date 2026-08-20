'use client';

import { MessageCircleMore, UsersRound } from 'lucide-react';
import OwnerPageShell from '@/components/owner/OwnerPageShell';

export default function TravelersPage() {
  return <OwnerPageShell title="Voyageurs" subtitle="Retrouvez les personnes attendues dans vos logements.">
    <section className="grid gap-5 md:grid-cols-2">
      <article className="rounded-[2rem] bg-[#17232c] p-7 text-white"><UsersRound className="text-[#ef8b64]" /><p className="mt-8 text-4xl font-semibold">0</p><p className="mt-1 text-sm text-white/60">Voyageur enregistré</p></article>
      <article className="rounded-[2rem] border border-[#e4ddd6] bg-white p-7"><MessageCircleMore className="text-[#d85b24]" /><h2 className="mt-8 text-xl font-semibold text-[#24292c]">Des arrivées plus sereines</h2><p className="mt-2 text-sm leading-6 text-[#77736f]">Les voyageurs apparaîtront ici dès qu’une réservation sera ajoutée à un logement.</p></article>
    </section>
  </OwnerPageShell>;
}
