'use client';

import { CalendarDays, Plus } from 'lucide-react';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export default function ReservationsPage() {
  return <OwnerPageShell title="Réservations" subtitle="Suivez les séjours associés à vos logements.">
    <section className="rounded-[2rem] border border-[#e4ddd6] bg-white p-6 shadow-[0_15px_36px_rgba(31,41,37,.06)] sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8e7df] text-[#d85b24]"><CalendarDays size={22} /></span>
      <h2 className="mt-5 text-2xl font-semibold text-[#24292c]">Aucune réservation pour le moment</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#77736f]">Ajoutez un logement et partagez son livret : vous pourrez ensuite centraliser ici les dates d’arrivée et de départ de vos voyageurs.</p>
      <Link href={ROUTES.OWNER_PROPERTY_NEW} className="mt-6 inline-flex"><Button className="rounded-xl bg-[#17232c]"><Plus className="mr-2 h-4 w-4" />Ajouter un logement</Button></Link>
    </section>
  </OwnerPageShell>;
}
