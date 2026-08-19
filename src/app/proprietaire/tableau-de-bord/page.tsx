'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import OwnerSidebar from '@/components/layout/OwnerSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import MobileNavigation from '@/components/layout/MobileNavigation';
import StatCard from '@/components/dashboard/StatCard';
import { ROUTES } from '@/config/routes';
import { createClient } from '@/lib/supabase/client';
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
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function OwnerDashboard() {
  const [properties, setProperties] = useState<Array<{ id: string; name: string; city: string; status: string; public_token: string }>>([]);
  const [events, setEvents] = useState<Array<{ property_id: string; event_type: string; occurred_at: string }>>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const [{ data: propertyData }, { data: eventData }] = await Promise.all([
        supabase.from('properties').select('id, name, city, status, public_token').order('updated_at', { ascending: false }),
        supabase.from('guide_events').select('property_id, event_type, occurred_at').order('occurred_at', { ascending: false }).limit(20),
      ]);
      if (!active) return;
      setProperties(propertyData ?? []);
      setEvents(eventData ?? []);
    };
    void load();
    return () => { active = false; };
  }, []);

  const publishedProperties = properties.filter((property) => property.status === 'published');
  const viewEvents = events.filter((event) => event.event_type === 'view');
  const scanEvents = events.filter((event) => event.event_type === 'qr_scan');

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
      title: 'Vues ce mois',
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
      title: 'Taux de satisfaction',
      value: '—',
      trend: 'Aucun avis enregistré',
      trendUp: true
    }
  ];

  const recentActivities = events.slice(0, 5).map((event) => {
    const property = properties.find((item) => item.id === event.property_id);
    const isScan = event.event_type === 'qr_scan';
    return {
      icon: isScan ? QrCode : Eye,
      title: `${isScan ? 'QR code scanné' : 'Livret consulté'}${property ? ` · ${property.name}` : ''}`,
      time: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.occurred_at)),
      color: isScan ? 'text-primary' : 'text-foreground',
    };
  });

  const propertyPerformance = properties.map((property) => ({
    ...property,
    views: events.filter((event) => event.property_id === property.id && event.event_type === 'view').length,
    scans: events.filter((event) => event.property_id === property.id && event.event_type === 'qr_scan').length,
    rating: 0,
  }));

  const quickActions = [
    {
      icon: Plus,
      label: 'Ajouter un logement',
      href: ROUTES.OWNER_PROPERTY_NEW,
    },
    {
      icon: FileText,
      label: 'Créer un livret',
      href: ROUTES.OWNER_PROPERTY_NEW,
    },
    { icon: QrCode, label: 'Générer un QR code', href: '#' },
    { icon: Calendar, label: 'Voir les réservations', href: '#' },
    ...(publishedProperties[0] ? [{ icon: Share2, label: 'Voir le livret voyageur', href: ROUTES.PUBLIC_BOOKLET(publishedProperties[0].public_token) }] : []),
    { icon: Users, label: 'Gérer l&apos;équipe', href: '#' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <OwnerSidebar />
      <MobileNavigation type="owner" />

      <div className="lg:ml-[250px]">
        <DashboardHeader title="Tableau de bord" />

        <main className="mx-auto max-w-[1440px] overflow-x-hidden px-4 py-5 pb-24 sm:px-8 sm:py-8">
          <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-[#17232c] px-6 py-7 text-white shadow-[0_22px_56px_rgba(23,35,44,.17)] sm:px-8 sm:py-9">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#e7754d]/25 blur-3xl" />
            <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-[#8eb8aa]/20 blur-2xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#f3a181]"><Sparkles size={13} /> Votre espace hôte</p>
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
                <select className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground sm:w-auto">
                  <option>30 derniers jours</option>
                  <option>7 derniers jours</option>
                  <option>90 derniers jours</option>
                </select>
              </div>
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#dcd5ce] bg-[#faf8f5]">
                <div className="text-center">
                  <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1ea] text-[#dc6538]"><TrendingUp size={24} /></span>
                  <p className="text-sm font-semibold text-foreground">{viewEvents.length ? `${viewEvents.length} vues enregistrées` : 'Vos statistiques apparaîtront ici'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Les consultations de vos livrets sont comptabilisées automatiquement.</p>
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-[1.75rem] border border-[#e8e1da] bg-white p-5 shadow-[0_12px_30px_rgba(31,41,37,.06)] sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Activité récente</h3>
                <a href="#" className="text-sm text-primary hover:underline">Voir tout</a>
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
                    Ce mois-ci
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
                      <th className="text-right py-3 text-sm font-medium text-muted-foreground">Vues ce mois</th>
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
                            {property.rating ? [...Array(property.rating)].map((_, i) => (
                              <Star key={i} size={14} className="text-warning fill-warning" />
                            )) : <span className="text-xs text-muted-foreground">—</span>}
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
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light font-serif text-lg font-semibold text-primary">
                        {property.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{property.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{property.city}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#f4f1ed] px-2.5 py-1.5 text-xs font-bold text-[#77736f]">
                        {property.rating ? `${property.rating},0` : '—'}
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
                  <a
                    key={index}
                    href={action.href}
                    className="flex items-center w-full h-12 px-4 rounded-lg text-foreground hover:bg-surface-soft transition-colors"
                  >
                    <action.icon size={18} className="mr-3 text-muted-foreground" />
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
