'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, ChevronRight, FilePenLine, Plus, Search } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/config/routes';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { toOwnerProperty } from '@/lib/property-mappers';
import type { OwnerProperty } from '@/lib/owner-properties';

export default function BookletsPage() {
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    let unsubscribeProperties: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeProperties?.();
      if (!user) {
        if (active) setLoadError('Votre session a expiré. Reconnectez-vous pour voir vos livrets.');
        return;
      }

      unsubscribeProperties = onSnapshot(
        query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)),
        (snapshot) => {
          if (active) setProperties([...snapshot.docs]
            .sort((first, second) => (second.data().updatedAt?.toMillis?.() ?? 0) - (first.data().updatedAt?.toMillis?.() ?? 0))
            .map((item) => toOwnerProperty({ id: item.id, ...item.data() })));
        },
        () => {
          if (active) setLoadError('Impossible de charger vos livrets. Réessayez dans un instant.');
        },
      );
    });

    return () => {
      active = false;
      unsubscribeProperties?.();
      unsubscribeAuth();
    };
  }, []);

  const booklets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('fr');
    return properties.filter((property) => !term || property.name.toLocaleLowerCase('fr').includes(term) || property.city.toLocaleLowerCase('fr').includes(term));
  }, [properties, search]);

  const publishedCount = properties.filter((property) => property.status === 'published').length;

  return (
    <OwnerPageShell title="Mes livrets" subtitle="Rédigez, publiez et partagez les guides d’accueil de vos logements.">
      {loadError && <p role="alert" className="mb-6 rounded-2xl border border-[#efc1bd] bg-[#fdeceb] px-5 py-4 text-sm text-[#b8453c]">{loadError}</p>}

      <section className="rounded-[2rem] bg-[#17232c] p-6 text-white shadow-[0_22px_60px_rgba(23,35,44,0.16)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#ef8b64]">Vos guides voyageurs</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Chaque séjour commence par un bon livret.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Modifiez le contenu de chaque guide, puis publiez-le lorsqu’il est prêt à être partagé.</p>
          </div>
          <Link href={ROUTES.OWNER_PROPERTY_NEW} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#df7045] px-5 text-sm font-semibold text-white">
            <Plus size={18} /> Créer un logement
          </Link>
        </div>
        <div className="mt-7 flex gap-8 border-t border-white/10 pt-5 text-sm">
          <p><span className="mr-2 text-2xl font-semibold">{properties.length}</span><span className="text-white/55">livrets</span></p>
          <p><span className="mr-2 text-2xl font-semibold">{publishedCount}</span><span className="text-white/55">publiés</span></p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#22272a]">Tous les livrets</h2>
            <p className="mt-1 text-sm text-[#77736f]">{booklets.length} {booklets.length > 1 ? 'livrets affichés' : 'livret affiché'}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8883]" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un livret…" className="h-11 rounded-xl border-[#ddd7d0] bg-white pl-11 shadow-none" />
          </div>
        </div>

        {booklets.length ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {booklets.map((property) => <BookletCard key={property.id} property={property} />)}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.8rem] border border-dashed border-[#d7d0c9] bg-white px-6 py-16 text-center">
            <BookOpen className="mx-auto text-[#d85b24]" size={30} />
            <h3 className="mt-4 font-semibold text-[#24292c]">Aucun livret trouvé</h3>
            <p className="mt-1 text-sm text-[#77736f]">Créez un logement pour démarrer votre premier guide d’accueil.</p>
          </div>
        )}
      </section>
    </OwnerPageShell>
  );
}

function BookletCard({ property }: { property: OwnerProperty }) {
  const published = property.status === 'published';
  return (
    <Link href={ROUTES.OWNER_BOOKLET_EDITOR(property.id)} className="group rounded-[1.6rem] border border-[#e4ddd6] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#df7045]/45 hover:shadow-[0_16px_32px_rgba(31,41,37,.08)]">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8e7df] text-[#d85b24]"><FilePenLine size={20} /></span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${published ? 'bg-[#eaf5f1] text-[#286454]' : 'bg-[#f3eee8] text-[#77736f]'}`}>{published ? 'Publié' : 'Brouillon'}</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-[#24292c]">{property.name || 'Sans nom'}</h3>
      <p className="mt-1 text-sm text-[#77736f]">{property.city || 'Adresse à compléter'}</p>
      <div className="mt-6 flex items-center justify-between border-t border-[#eee8e2] pt-4 text-sm font-semibold text-[#303634]">
        <span className="flex items-center gap-2">{published && <CheckCircle2 size={16} className="text-[#397d6d]" />}{published ? 'Gérer le livret' : 'Continuer la rédaction'}</span>
        <ChevronRight size={18} className="text-[#d85b24] transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
