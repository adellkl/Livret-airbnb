'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import OwnerSidebar from '@/components/layout/OwnerSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import MobileNavigation from '@/components/layout/MobileNavigation';
import StatCard from '@/components/dashboard/StatCard';
import EmailVerificationNotice from '@/components/auth/EmailVerificationNotice';
import { ROUTES } from '@/config/routes';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Home,
  BookOpen,
  Eye,
  QrCode,
  Star,
  TrendingUp,
  Calendar,
  Plus,
  FileText,
  Share2,
  Users,
  ArrowRight
} from 'lucide-react';

export default function OwnerDashboard() {
  const [properties, setProperties] = useState<Array<{ id: string; name: string; city: string; status: string; publicToken: string; coverImage: string }>>([]);
  const [events, setEvents] = useState<Array<{ propertyId: string; eventType: string; occurredAt: Date | null }>>([]);
  const [reviews, setReviews] = useState<Array<{ propertyId: string; score: number }>>([]);
  const [period, setPeriod] = useState(30);
  const [periodStart, setPeriodStart] = useState(() => Date.now() - 30 * 86400000);

  useEffect(() => {
    let active = true;
    let unsubscribeProperties: (() => void) | undefined;
    let unsubscribeEvents: (() => void) | undefined;
    let unsubscribeReviews: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeProperties?.();
      unsubscribeEvents?.();
      unsubscribeReviews?.();
      if (!user) {
        if (active) { setProperties([]); setEvents([]); setReviews([]); }
        return;
      }
      unsubscribeProperties = onSnapshot(query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)), (snapshot) => {
        if (active) setProperties(snapshot.docs.map((item) => ({
          id: item.id,
          name: String(item.data().name ?? ''),
          city: String(item.data().city ?? ''),
          status: String(item.data().status ?? 'draft'),
          publicToken: String(item.data().publicToken ?? item.id),
          coverImage: String(item.data().coverImage ?? item.data().cover_image_url ?? ''),
        })));
      });
      unsubscribeEvents = onSnapshot(query(collection(firestore, 'guide_events'), where('ownerId', '==', user.uid)), (snapshot) => {
        if (active) setEvents(snapshot.docs
          .map((item) => ({
            propertyId: String(item.data().propertyId ?? ''),
            eventType: String(item.data().eventType ?? ''),
            occurredAt: item.data().occurredAt?.toDate?.() ?? null,
          }))
          .sort((first, second) => (second.occurredAt?.getTime() ?? 0) - (first.occurredAt?.getTime() ?? 0)));
      });
      unsubscribeReviews = onSnapshot(query(collection(firestore, 'guide_reviews'), where('ownerId', '==', user.uid)), (snapshot) => {
        if (active) setReviews(snapshot.docs.map((item) => ({
          propertyId: String(item.data().propertyId ?? ''),
          score: Number(item.data().score ?? 0),
        })).filter((review) => review.score >= 1 && review.score <= 5));
      });
    });
    return () => { active = false; unsubscribeProperties?.(); unsubscribeEvents?.(); unsubscribeReviews?.(); unsubscribeAuth(); };
  }, []);

  const publishedProperties = properties.filter((property) => property.status === 'published');
  const periodEvents = useMemo(() => events.filter((event) => !event.occurredAt || event.occurredAt >= new Date(periodStart)), [events, periodStart]);
  const viewEvents = periodEvents.filter((event) => event.eventType === 'view');
  const scanEvents = periodEvents.filter((event) => event.eventType === 'qr_scan');
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.score, 0) / reviews.length
    : null;
  const viewSeries = useMemo(() => {
    const start = new Date(periodStart);
    start.setHours(0, 0, 0, 0);
    const dailyViews = new Map<string, number>();
    viewEvents.forEach((event) => {
      if (!event.occurredAt) return;
      const key = event.occurredAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      dailyViews.set(key, (dailyViews.get(key) ?? 0) + 1);
    });
    return Array.from({ length: period }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const label = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      return { label, value: dailyViews.get(label) ?? 0 };
    });
  }, [period, periodStart, viewEvents]);
  const maxViewValue = Math.max(...viewSeries.map((point) => point.value), 1);

  const stats = [
    {
      icon: Home,
      title: 'Logements actifs',
      value: String(properties.length),
      trend: 'Total de votre compte',
      trendUp: true
    },
    {
      icon: BookOpen,
      title: 'Livrets publiés',
      value: String(publishedProperties.length),
      trend: 'Disponibles aux voyageurs',
      trendUp: true
    },
    {
      icon: Eye,
      title: 'Vues sur la période',
      value: String(viewEvents.length),
      trend: 'Événements enregistrés',
      trendUp: true
    },
    {
      icon: QrCode,
      title: 'Scans QR',
      value: String(scanEvents.length),
      trend: 'Événements enregistrés',
      trendUp: true
    },
    {
      icon: Star,
      title: 'Satisfaction',
      value: averageRating ? averageRating.toFixed(1).replace('.', ',') + '/5' : '—',
      trend: reviews.length ? reviews.length + ' avis reçu' + (reviews.length > 1 ? 's' : '') : 'Aucun avis enregistré',
      trendUp: true
    }
  ];

  const recentActivities = events.slice(0, 5).map((event) => {
    const property = properties.find((item) => item.id === event.propertyId);
    const isScan = event.eventType === 'qr_scan';
    return {
      icon: isScan ? QrCode : Eye,
      title: `${isScan ? 'QR code scanné' : 'Livret consulté'}${property ? ` · ${property.name}` : ''}`,
      time: event.occurredAt ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(event.occurredAt) : 'À l’instant',
      color: isScan ? 'text-primary' : 'text-foreground',
    };
  });

  const propertyPerformance = properties.map((property) => ({
    ...property,
    views: periodEvents.filter((event) => event.propertyId === property.id && event.eventType === 'view').length,
    scans: periodEvents.filter((event) => event.propertyId === property.id && event.eventType === 'qr_scan').length,
    rating: (() => {
      const propertyReviews = reviews.filter((review) => review.propertyId === property.id);
      return propertyReviews.length ? propertyReviews.reduce((total, review) => total + review.score, 0) / propertyReviews.length : null;
    })(),
  }));

  const bookletProperty = properties.find((property) => property.status === 'draft') ?? properties[0];
  const shareProperty = publishedProperties[0] ?? properties.find((property) => property.status === 'draft') ?? properties[0];
  const quickActions = [
    {
      icon: Plus,
      label: 'Ajouter un logement',
      href: ROUTES.OWNER_PROPERTY_NEW,
    },
    {
      icon: FileText,
      label: bookletProperty ? 'Gérer le livret' : 'Créer un livret',
      href: bookletProperty ? ROUTES.OWNER_BOOKLET_EDITOR(bookletProperty.id) : ROUTES.OWNER_PROPERTY_NEW,
    },
    {
      icon: QrCode,
      label: publishedProperties[0]
        ? 'Générer un QR code'
        : shareProperty
          ? 'Publier un livret pour générer un QR code'
          : 'Créer un logement pour générer un QR code',
      href: shareProperty ? ROUTES.OWNER_PROPERTY_SHARE(shareProperty.id) : ROUTES.OWNER_PROPERTY_NEW,
    },
    { icon: Calendar, label: 'Gérer l’accès voyageur', href: ROUTES.OWNER_RESERVATIONS },
    ...(publishedProperties[0] ? [{ icon: Share2, label: 'Voir le livret voyageur', href: ROUTES.PUBLIC_BOOKLET(publishedProperties[0].publicToken) }] : []),
    { icon: Users, label: 'Gérer les voyageurs', href: ROUTES.OWNER_TRAVELERS }
  ];

  return (
    <div className="min-h-screen bg-background">
      <OwnerSidebar />
      <MobileNavigation type="owner" />

      <div className="lg:ml-[250px]">
        <DashboardHeader
          title="Tableau de bord"
          subtitle="Suivez l’activité de vos logements et de vos livrets en un seul coup d’œil."
        />

        <main className="mx-auto max-w-[1440px] overflow-x-hidden px-4 py-5 pb-24 sm:px-8 sm:py-8">
          <EmailVerificationNotice />
          <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-[#17232c] px-6 py-7 text-white shadow-[0_22px_56px_rgba(23,35,44,.17)] sm:px-8 sm:py-9">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#e7754d]/25 blur-3xl" />
            <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-[#8eb8aa]/20 blur-2xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#f3a181]"><Home size={13} /> Votre espace hôte</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">{properties.length ? 'Votre accueil prend vie.' : 'Prêt à créer une belle arrivée ?'}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">{properties.length ? 'Gardez un œil sur vos livrets et partagez des informations utiles à chaque voyageur.' : 'Commencez par votre premier logement : son guide d’accueil sera prêt en quelques minutes.'}</p>
              </div>
              <Link href={ROUTES.OWNER_PROPERTY_NEW} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#e7754d] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(231,117,77,.25)] transition hover:-translate-y-0.5 hover:bg-[#f1855e]">
                <Plus size={18} /> {properties.length ? 'Ajouter un logement' : 'Créer mon premier logement'} <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <div className="mb-7 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.map((stat, index) => (
              <div key={index} className={index === stats.length - 1 ? 'col-span-2 xl:col-span-1' : ''}>
                <StatCard {...stat} />
              </div>
            ))}
          </div>

          <div className="mb-6 grid gap-5 lg:grid-cols-3 lg:gap-8">
            <div className="min-w-0 rounded-[1.75rem] border border-[#e8e1da] bg-white p-5 shadow-[0_12px_30px_rgba(31,41,37,.06)] sm:p-6 lg:col-span-2">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-foreground">Vues des livrets</h3>
                <select value={period} onChange={(event) => { const nextPeriod = Number(event.target.value); setPeriod(nextPeriod); setPeriodStart(Date.now() - nextPeriod * 86400000); }} className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground sm:w-auto">
                  <option value={30}>30 derniers jours</option>
                  <option value={7}>7 derniers jours</option>
                  <option value={90}>90 derniers jours</option>
                </select>
              </div>
              {viewEvents.length ? (
                <div className="h-64 rounded-2xl border border-[#eee7e0] bg-[#faf8f5] px-3 pb-7 pt-5 sm:px-5">
                  <div className="flex h-full items-end gap-1.5" aria-label={viewEvents.length + ' vues sur la période sélectionnée'}>
                    {viewSeries.map((point, index) => (
                      <div key={point.label + '-' + index} className="group flex h-full min-w-0 flex-1 items-end">
                        <div
                          title={point.label + ' : ' + point.value + ' vue' + (point.value > 1 ? 's' : '')}
                          className="w-full rounded-t-md bg-[#e7754d] transition hover:bg-[#c9532d]"
                          style={{ height: Math.max((point.value / maxViewValue) * 100, point.value ? 7 : 1) + '%' }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>{viewSeries[0]?.label}</span>
                    <span>{viewEvents.length} vues réelles</span>
                    <span>{viewSeries.at(-1)?.label}</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#dcd5ce] bg-[#faf8f5]">
                  <div className="text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1ea] text-[#dc6538]"><TrendingUp size={24} /></span>
                    <p className="text-sm font-semibold text-foreground">Aucune vue sur cette période</p>
                    <p className="mt-1 text-xs text-muted-foreground">Les consultations sont ajoutées automatiquement dès l’ouverture d’un livret.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 rounded-[1.75rem] border border-[#e8e1da] bg-white p-5 shadow-[0_12px_30px_rgba(31,41,37,.06)] sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Activité récente</h3>
                <span className="text-xs font-medium text-muted-foreground">En temps réel</span>
              </div>
              <div className="space-y-4">
                {recentActivities.length ? recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${activity.color === 'text-primary' ? 'bg-primary-light' : activity.color === 'text-success' ? 'bg-success-light' : 'bg-surface-soft'}`}>
                      <activity.icon size={16} className={activity.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                )) : <div className="rounded-2xl bg-[#faf8f5] px-4 py-8 text-center"><Calendar size={20} className="mx-auto mb-2 text-[#dc6538]" /><p className="text-sm font-semibold text-foreground">Aucune activité pour le moment</p><p className="mt-1 text-xs text-muted-foreground">Publiez un livret pour suivre les premières consultations.</p></div>}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
            <div className="min-w-0 rounded-[1.75rem] border border-[#e8e1da] bg-white p-5 shadow-[0_12px_30px_rgba(31,41,37,.06)] sm:p-6 lg:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    Période sélectionnée
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">Vos logements</h3>
                </div>
                <Link href={ROUTES.OWNER_PROPERTIES} className="rounded-full border border-[#e2d9d1] px-3 py-2 text-xs font-semibold text-primary transition hover:bg-[#fff1ea]">
                  Tout voir
                </Link>
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Logement</th>
                      <th className="text-right py-3 text-sm font-medium text-muted-foreground">Vues</th>
                      <th className="text-right py-3 text-sm font-medium text-muted-foreground">Scans QR</th>
                      <th className="text-right py-3 text-sm font-medium text-muted-foreground">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyPerformance.length ? propertyPerformance.map((property, index) => (
                      <tr key={index} className="border-b border-border last:border-b-0">
                        <td className="py-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{property.name}</p>
                            <p className="text-xs text-muted-foreground">{property.city}</p>
                          </div>
                        </td>
                        <td className="text-right py-4 text-sm text-foreground">{property.views}</td>
                        <td className="text-right py-4 text-sm text-foreground">{property.scans}</td>
                        <td className="text-right py-4">
                          <div className="flex justify-end">
                            {property.rating ? <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#4d665d]">{property.rating.toFixed(1).replace('.', ',')} <Star size={14} className="fill-[#e7754d] text-[#e7754d]" /></span> : <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </td>
                      </tr>
                    )) : <tr><td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">Votre premier logement apparaîtra ici dès sa création.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-border sm:hidden">
                {propertyPerformance.length ? propertyPerformance.map((property) => (
                  <div key={property.name} className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-light font-serif text-lg font-semibold text-primary">
                        {property.coverImage ? (
                          <Image src={property.coverImage} alt={`Photo de ${property.name}`} fill unoptimized sizes="44px" className="object-cover" />
                        ) : property.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{property.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{property.city}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#f4f1ed] px-2.5 py-1.5 text-xs font-bold text-[#77736f]">
                        {property.rating ? property.rating.toFixed(1).replace('.', ',') : '—'}
                        {property.rating ? <Star size={12} className="fill-current" /> : null}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 pl-14 text-xs text-muted-foreground">
                      <span><strong className="text-foreground">{property.views}</strong> vues</span>
                      <span className="h-3 w-px bg-border" />
                      <span><strong className="text-foreground">{property.scans}</strong> scans QR</span>
                    </div>
                  </div>
                )) : <div className="py-10 text-center text-sm text-muted-foreground">Votre premier logement apparaîtra ici.</div>}
              </div>
            </div>

            <div className="min-w-0 rounded-[1.75rem] border border-[#e8e1da] bg-white p-5 shadow-[0_12px_30px_rgba(31,41,37,.06)] sm:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Actions rapides</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="flex h-12 w-full items-center rounded-lg px-4 text-foreground transition-colors hover:bg-surface-soft"
                  >
                    <action.icon size={18} className="mr-3 text-muted-foreground" />
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
