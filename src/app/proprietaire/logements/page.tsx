'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/config/routes';
import {
  type OwnerProperty,
} from '@/lib/owner-properties';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { toOwnerProperty } from '@/lib/property-mappers';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ArrowRight,
  BedDouble,
  BookOpen,
  Building2,
  CheckCircle2,
  Eye,
  Home,
  ImageIcon,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

type StatusFilter = 'all' | 'published' | 'draft';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [createdPropertyName, setCreatedPropertyName] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    let unsubscribeProperties: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        setLoadError('Votre session a expiré. Reconnectez-vous pour voir vos logements.');
        return;
      }
      const propertiesQuery = query(
        collection(firestore, 'properties'),
        where('ownerId', '==', user.uid),
      );
      unsubscribeProperties?.();
      unsubscribeProperties = onSnapshot(propertiesQuery, (snapshot) => {
        if (active) {
          const sortedProperties = [...snapshot.docs]
            .sort((first, second) => {
              const firstUpdatedAt = first.data().updatedAt?.toMillis?.() ?? 0;
              const secondUpdatedAt = second.data().updatedAt?.toMillis?.() ?? 0;
              return secondUpdatedAt - firstUpdatedAt;
            })
            .map((item) => toOwnerProperty({ id: item.id, ...item.data() }));
          setProperties(sortedProperties);

          void (async () => {
            const guideChecks = await Promise.all(snapshot.docs.map(async (propertyDocument) => ({
              propertyDocument,
              guide: await getDoc(doc(firestore, 'public_guides', propertyDocument.id)),
            })));
            const missingGuides = guideChecks.filter(({ guide }) => !guide.exists());
            if (!missingGuides.length) return;

            const batch = writeBatch(firestore);
            missingGuides.forEach(({ propertyDocument }) => {
              const propertyData = propertyDocument.data();
              batch.set(doc(firestore, 'public_guides', propertyDocument.id), {
                ...propertyData,
                propertyId: propertyDocument.id,
                publishedAt: propertyData.publishedAt ?? serverTimestamp(),
              });
            });
            await batch.commit();
          })().catch(() => {
            if (active) setLoadError('Impossible de générer les liens de vos logements. Réessayez dans un instant.');
          });
        }
      }, () => {
        if (active) setLoadError('Impossible de charger vos logements. Réessayez dans un instant.');
      });
    });
    const load = () => {
      const createdName = window.sessionStorage.getItem('livret-property-created');
      if (createdName) {
        setCreatedPropertyName(createdName);
        window.sessionStorage.removeItem('livret-property-created');
      }
    };
    load();
    return () => { active = false; unsubscribeProperties?.(); unsubscribeAuth(); };
  }, []);

  const filteredProperties = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('fr');

    return properties.filter((property) => {
      const matchesSearch =
        !normalizedSearch ||
        property.name.toLocaleLowerCase('fr').includes(normalizedSearch) ||
        property.city.toLocaleLowerCase('fr').includes(normalizedSearch) ||
        property.type.toLocaleLowerCase('fr').includes(normalizedSearch);
      const matchesStatus =
        statusFilter === 'all' || property.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  const publishedCount = properties.filter(
    (property) => property.status === 'published'
  ).length;
  const totalViews = properties.reduce(
    (total, property) => total + property.views,
    0
  );

  return (
    <div className="min-h-screen bg-[#f6f3ef]">
      <OwnerSidebar />
      <MobileNavigation type="owner" />

      <div className="lg:ml-[250px]">
        <DashboardHeader
          title="Mes logements"
          subtitle="Créez un espace d’accueil unique pour chacun de vos logements."
        />

        <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-8 sm:py-8">
          {loadError && <p role="alert" className="mb-6 rounded-2xl border border-[#efc1bd] bg-[#fdeceb] px-5 py-4 text-sm text-[#b8453c]">{loadError}</p>}
          {createdPropertyName && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#bcdacf] bg-[#eaf5f1] px-5 py-4 text-[#286454]">
              <div className="flex min-w-0 items-center gap-3">
                <CheckCircle2 size={20} className="shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">{createdPropertyName}</span> a
                  bien été ajouté à vos logements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreatedPropertyName('')}
                aria-label="Fermer le message"
                className="shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <section className="overflow-hidden rounded-[2rem] bg-[#17232c] text-white shadow-[0_22px_60px_rgba(23,35,44,0.16)]">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#ef8b64]">
                  Votre portefeuille
                </p>
                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Un livret clair pour chaque adresse.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/58">
                  Centralisez les informations pratiques, les accès et les
                  recommandations que chaque voyageur doit connaître.
                </p>
              </div>
              <Link
                href={ROUTES.OWNER_PROPERTY_NEW}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#df7045] px-5 text-sm font-semibold text-white"
              >
                <Plus size={18} />
                Créer un logement
              </Link>
            </div>

            <div className="grid grid-cols-3 border-t border-white/10">
              <PortfolioStat
                icon={Building2}
                value={String(properties.length)}
                label="Logements"
              />
              <PortfolioStat
                icon={BookOpen}
                value={String(publishedCount)}
                label="Livrets publiés"
              />
              <PortfolioStat
                icon={Eye}
                value={totalViews.toLocaleString('fr-FR')}
                label="Consultations"
              />
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#22272a]">
                  Tous les logements
                </h2>
                <p className="mt-1 text-sm text-[#77736f]">
                  {filteredProperties.length}{' '}
                  {filteredProperties.length > 1 ? 'logements affichés' : 'logement affiché'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:w-72">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8883]"
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher une adresse…"
                    className="h-11 rounded-xl border-[#ddd7d0] bg-white pl-11 shadow-none"
                  />
                </div>
                <div className="flex rounded-xl border border-[#ddd7d0] bg-white p-1">
                  {[
                    ['all', 'Tous'],
                    ['published', 'Publiés'],
                    ['draft', 'Brouillons'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value as StatusFilter)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        statusFilter === value
                          ? 'bg-[#17232c] text-white'
                          : 'text-[#6e6a66]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredProperties.length > 0 ? (
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredProperties.map((property, index) => (
                  <PropertyCard key={property.id} property={property} priority={index === 0} />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.8rem] border border-dashed border-[#d7d0c9] bg-white px-6 py-16 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4ece6] text-[#d85b24]">
                  <Search size={21} />
                </span>
                <h3 className="mt-4 font-semibold text-[#24292c]">
                  Aucun logement trouvé
                </h3>
                <p className="mt-1 text-sm text-[#77736f]">
                  Essayez un autre terme ou modifiez le filtre.
                </p>
              </div>
            )}
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[1.6rem] border border-[#e4ddd6] bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8e7df] text-[#d85b24]">
                <Sparkles size={19} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                Commencez par l’essentiel
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#77736f]">
                Une adresse, les horaires, le Wi-Fi et un contact suffisent pour
                créer une première version utile du livret.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-[#e4ddd6] bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f3ef] text-[#397d6d]">
                <Users size={19} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                Adaptez chaque expérience
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#77736f]">
                Chaque logement possède ses propres accès, équipements,
                recommandations et informations d’urgence.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function PortfolioStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Home;
  value: string;
  label: string;
}) {
  return (
    <div className="border-r border-white/10 px-3 py-4 text-center last:border-r-0 sm:px-6 sm:text-left">
      <div className="flex items-center justify-center gap-2 sm:justify-start">
        <Icon size={15} className="hidden text-[#ef8b64] sm:block" />
        <span className="text-lg font-semibold sm:text-xl">{value}</span>
      </div>
      <p className="mt-0.5 truncate text-[10px] text-white/45 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function PropertyCard({ property, priority = false }: { property: OwnerProperty; priority?: boolean }) {
  const propertyImage = property.coverImage.trim() || property.gallery?.find((photo) => photo.url.trim())?.url.trim();

  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-[#e4ddd6] bg-white shadow-[0_12px_35px_rgba(32,28,24,0.05)]">
      <div className="relative h-48 overflow-hidden bg-[#ece7e1]">
        {propertyImage ? (
          <Image
            src={propertyImage}
            alt={`Photo de ${property.name || 'votre logement'}`}
            fill
            unoptimized
            priority={priority}
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_75%_20%,rgba(223,112,69,.42),transparent_28%),linear-gradient(135deg,#17232c,#30434a)] text-white/75">
            <div className="flex flex-col items-center gap-2 text-xs font-medium"><ImageIcon size={22} />Photo du logement à ajouter</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
              property.status === 'published'
                ? 'bg-[#e9f4ef] text-[#2f755f]'
                : 'bg-white/92 text-[#736e69]'
            }`}
          >
            {property.status === 'published' ? 'Publié' : 'Brouillon'}
          </span>
          <span className="rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">
            {property.completion}% complété
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">
            {property.type} · {property.city}
          </p>
          <h3 className="mt-1 truncate text-xl font-semibold">
            {property.name}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-2 text-xs leading-5 text-[#77736f]">
          <MapPin size={15} className="mt-0.5 shrink-0 text-[#d85b24]" />
          <span>
            {property.address}, {property.postalCode} {property.city}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4 border-y border-[#eee9e4] py-3 text-xs text-[#686662]">
          <span className="flex items-center gap-1.5">
            <Users size={15} />
            {property.capacity} voyageurs
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble size={15} />
            {property.bedrooms} chambre{property.bedrooms > 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#9a948e]">
              {property.updatedAt}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#4f5455]">
              {property.views} consultation{property.views > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={property.status === 'published' ? ROUTES.PUBLIC_BOOKLET(property.id) : `${ROUTES.PUBLIC_BOOKLET(property.id)}?preview=1`}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center rounded-xl border border-[#d8d1ca] px-3 text-xs font-semibold text-[#37403d]"
            >
              {property.status === 'published' ? 'Voir le livret' : 'Aperçu du livret'}
            </Link>
            <Link
              href={ROUTES.OWNER_PROPERTY_DETAIL(property.id)}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#17232c] px-4 text-xs font-semibold text-white"
            >
              Gérer
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
