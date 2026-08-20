'use client';

import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, Eye, Home } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import ProFeatureGate from '@/components/subscription/ProFeatureGate';

export default function StatisticsPage() {
  const [total, setTotal] = useState(0);
  const [published, setPublished] = useState(0);
  const [views, setViews] = useState(0);
  useEffect(() => {
    let stopProperties: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopProperties?.();
      if (!user) return;
      stopProperties = onSnapshot(query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)), (snapshot) => {
        setTotal(snapshot.size);
        setPublished(snapshot.docs.filter((item) => item.data().status === 'published').length);
        setViews(snapshot.docs.reduce((sum, item) => sum + Number(item.data().views ?? 0), 0));
      });
    });
    return () => { stopProperties?.(); stopAuth(); };
  }, []);
  const cards = [{ icon: Home, value: total, label: 'Logements' }, { icon: BookOpen, value: published, label: 'Livrets publiés' }, { icon: Eye, value: views, label: 'Consultations' }];
  return <OwnerPageShell title="Statistiques" subtitle="Mesurez les performances de vos livrets en temps réel.">
    <ProFeatureGate title="Pilotez vos performances" description="Accédez aux vues, scans QR et tendances de vos livrets avec la formule Pro."><><section className="grid gap-4 sm:grid-cols-3">{cards.map((card) => <article key={card.label} className="rounded-[1.7rem] border border-[#e4ddd6] bg-white p-6"><card.icon className="text-[#d85b24]" /><p className="mt-7 text-4xl font-semibold text-[#24292c]">{card.value}</p><p className="mt-1 text-sm text-[#77736f]">{card.label}</p></article>)}</section><section className="mt-6 flex min-h-72 items-center justify-center rounded-[2rem] border border-dashed border-[#d7d0c9] bg-white text-center"><div><BarChart3 className="mx-auto h-9 w-9 text-[#d85b24]" /><h2 className="mt-4 text-xl font-semibold">Les tendances arrivent ici</h2><p className="mt-2 text-sm text-[#77736f]">Les vues et scans de vos livrets seront affichés au fil des visites.</p></div></section></></ProFeatureGate>
  </OwnerPageShell>;
}
