'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, Eye, Home, QrCode } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import ProFeatureGate from '@/components/subscription/ProFeatureGate';

export default function StatisticsPage() {
  const [total, setTotal] = useState(0);
  const [published, setPublished] = useState(0);
  const [events, setEvents] = useState<Array<{ eventType: string; occurredAt: Date | null }>>([]);
  const [periodStart] = useState(() => Date.now() - 30 * 86400000);
  useEffect(() => {
    let stopProperties: (() => void) | undefined;
    let stopEvents: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopProperties?.();
      stopEvents?.();
      if (!user) return;
      stopProperties = onSnapshot(query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)), (snapshot) => {
        setTotal(snapshot.size);
        setPublished(snapshot.docs.filter((item) => item.data().status === 'published').length);
      });
      stopEvents = onSnapshot(query(collection(firestore, 'guide_events'), where('ownerId', '==', user.uid)), (snapshot) => {
        setEvents(snapshot.docs.map((item) => ({
          eventType: String(item.data().eventType ?? ''),
          occurredAt: item.data().occurredAt?.toDate?.() ?? null,
        })));
      });
    });
    return () => { stopProperties?.(); stopEvents?.(); stopAuth(); };
  }, []);
  const lastThirtyDays = useMemo(() => {
    return events.filter((event) => !event.occurredAt || event.occurredAt.getTime() >= periodStart);
  }, [events, periodStart]);
  const views = lastThirtyDays.filter((event) => event.eventType === 'view').length;
  const scans = lastThirtyDays.filter((event) => event.eventType === 'qr_scan').length;
  const cards = [
    { icon: Home, value: total, label: 'Logements' },
    { icon: BookOpen, value: published, label: 'Livrets publiés' },
    { icon: Eye, value: views, label: 'Vues (30 jours)' },
    { icon: QrCode, value: scans, label: 'Scans QR (30 jours)' },
  ];
  return <OwnerPageShell title="Statistiques" subtitle="Mesurez les performances de vos livrets en temps réel.">
    <ProFeatureGate title="Pilotez vos performances" description="Accédez aux vues, scans QR et tendances de vos livrets avec la formule Pro."><><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <article key={card.label} className="rounded-[1.7rem] border border-[#e4ddd6] bg-white p-6"><card.icon className="text-[#d85b24]" /><p className="mt-7 text-4xl font-semibold text-[#24292c]">{card.value}</p><p className="mt-1 text-sm text-[#77736f]">{card.label}</p></article>)}</section><section className="mt-6 flex min-h-72 items-center justify-center rounded-[2rem] border border-dashed border-[#d7d0c9] bg-white text-center"><div><BarChart3 className="mx-auto h-9 w-9 text-[#d85b24]" /><h2 className="mt-4 text-xl font-semibold">{views || scans ? 'Données actualisées en temps réel' : 'En attente des premières visites'}</h2><p className="mt-2 max-w-md text-sm text-[#77736f]">{views || scans ? 'Les compteurs ci-dessus sont issus des ouvertures de vos livrets et des scans de leurs QR codes.' : 'Les vues et scans seront visibles ici dès qu’un voyageur ouvre un livret.'}</p></div></section></></ProFeatureGate>
  </OwnerPageShell>;
}
