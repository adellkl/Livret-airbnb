'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BatteryMedium,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Copy,
  Eye,
  FilePenLine,
  GripVertical,
  Home,
  KeyRound,
  LayoutDashboard,
  MessageCircle,
  Navigation,
  MapPin,
  MonitorCog,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Thermometer,
  Users,
  Wifi,
} from 'lucide-react';
import { DEFAULT_OWNER_PROPERTIES } from '@/lib/owner-properties';

type DemoMode = 'traveler' | 'owner';
type TravelerScreen =
  | 'welcome'
  | 'essentials'
  | 'equipment'
  | 'nearby'
  | 'departure';
type OwnerScreen = 'overview' | 'editor' | 'stats' | 'publish';

const demoProperty = DEFAULT_OWNER_PROPERTIES[0];
const parisHero =
  'https://unsplash.com/photos/wAScP0OY-yM/download?force=true&w=1200';
const hostAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=85';

const travelerScreens: Array<{
  id: TravelerScreen;
  label: string;
  title: string;
}> = [
  { id: 'welcome', label: 'Bienvenue', title: 'Votre séjour' },
  { id: 'essentials', label: 'L’essentiel', title: 'Accès & Wi-Fi' },
  { id: 'equipment', label: 'Guides', title: 'Équipements' },
  { id: 'nearby', label: 'Le quartier', title: 'À proximité' },
  { id: 'departure', label: 'Dernière étape', title: 'Mon départ' },
];

const ownerScreens: Array<{
  id: OwnerScreen;
  label: string;
  title: string;
}> = [
  { id: 'overview', label: 'Pilotage', title: 'Vue d’ensemble' },
  { id: 'editor', label: 'Contenu', title: 'Éditeur du livret' },
  { id: 'stats', label: 'Performance', title: 'Statistiques' },
  { id: 'publish', label: 'Diffusion', title: 'Publication' },
];

const equipmentGuides = [
  { name: 'Télévision', subtitle: 'Smart TV', icon: MonitorCog },
  { name: 'Machine à café', subtitle: 'Capsules fournies', icon: Coffee },
  { name: 'Chauffage', subtitle: 'Réglage conseillé 21 °C', icon: Thermometer },
];

const nearbyPlaces = [
  {
    name: 'Le Tout-Paris',
    type: 'Cuisine française',
    category: 'Restaurants',
    time: '6 min',
    rating: '4,8',
  },
  {
    name: 'Dose Batignolles',
    type: 'Café & brunch',
    category: 'Cafés',
    time: '4 min',
    rating: '4,7',
  },
  {
    name: 'Parc Monceau',
    type: 'Balade',
    category: 'Balades',
    time: '12 min',
    rating: '4,9',
  },
];

const ownerSections = [
  { id: 'welcome', label: 'Bienvenue', icon: '👋' },
  { id: 'arrival', label: 'Arrivée & accès', icon: '🗝️' },
  { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { id: 'equipment', label: 'Équipements', icon: '📺' },
  { id: 'nearby', label: 'À proximité', icon: '🍽️' },
];

function TravelerDemo({
  screen,
  copiedValue,
  setCopiedValue,
  selectedEquipment,
  setSelectedEquipment,
  departureTasks,
  setDepartureTasks,
  nearbyFilter,
  setNearbyFilter,
  selectedPlace,
  setSelectedPlace,
}: {
  screen: TravelerScreen;
  copiedValue: string | null;
  setCopiedValue: (value: string | null) => void;
  selectedEquipment: string;
  setSelectedEquipment: (value: string) => void;
  departureTasks: boolean[];
  setDepartureTasks: (value: boolean[]) => void;
  nearbyFilter: string;
  setNearbyFilter: (value: string) => void;
  selectedPlace: string;
  setSelectedPlace: (value: string) => void;
}) {
  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard?.writeText(value);
    } finally {
      setCopiedValue(label);
    }
  };

  if (screen === 'welcome') {
    return (
      <div className="h-full bg-[#102a3d] text-white">
        <div className="relative h-[65%] overflow-hidden">
          <Image
            src={parisHero}
            alt=""
            fill
            unoptimized
            sizes="292px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071821]/35 via-transparent to-[#071821]/95" />
          <div className="absolute inset-x-4 top-11 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-2.5 py-2 backdrop-blur-md">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d9694d] font-serif italic">
                L
              </span>
              <span>
                <span className="block font-serif text-[11px] font-semibold">
                  livret d’accueil
                </span>
                <span className="block text-[6px] uppercase tracking-[0.12em] text-white/55">
                  Votre guide privé
                </span>
              </span>
            </div>
            <span className="rounded-lg border border-white/15 bg-black/20 px-2 py-1.5 text-[8px] font-bold backdrop-blur-md">
              🇫🇷 FR
            </span>
          </div>
          <div className="absolute inset-x-5 bottom-5">
            <div className="flex items-center gap-2">
              <span className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white/80">
                <Image
                  src={hostAvatar}
                  alt=""
                  fill
                  unoptimized
                  sizes="32px"
                  className="object-cover"
                />
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#ffd0b8]">
                Marie vous accueille
              </span>
            </div>
            <p className="mt-4 text-[8px] font-bold uppercase tracking-[0.18em] text-white/60">
              Votre séjour commence ici
            </p>
            <p className="mt-1 font-serif text-3xl font-semibold leading-none tracking-[-0.04em]">
              Bienvenue à <span className="italic text-[#ffd0b8]">Paris.</span>
            </p>
          </div>
        </div>
        <div className="p-4">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif text-sm font-semibold">
                  {demoProperty.name}
                </p>
                <p className="mt-0.5 text-[8px] uppercase tracking-[0.1em] text-white/50">
                  {demoProperty.type} · {demoProperty.capacity} voyageurs
                </p>
              </div>
              <ShieldCheck className="h-4 w-4 text-[#ffd0b8]" />
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-[9px] text-white/65">
              <MapPin className="h-3 w-3 text-[#ffd0b8]" />
              {demoProperty.address}, {demoProperty.city}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'essentials') {
    return (
      <div className="h-full bg-[#fbfaf8] px-4 pb-4 pt-11 text-[#142c3f]">
        <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#367566]">
          {demoProperty.name}
        </p>
        <h3 className="mt-1 font-serif text-2xl tracking-[-0.035em]">
          Les infos essentielles
        </h3>

        <div className="mt-4 rounded-[1.35rem] border border-[#b9d1c9] bg-[#e9f2ef] p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#367566] text-white">
              <Wifi className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#367566]">
                Wi-Fi de l’appartement
              </p>
              <p className="text-[11px] font-semibold">Connectez-vous en un geste</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyValue(demoProperty.wifiName, 'network')}
            className="mt-3 flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left"
          >
            <span>
              <span className="block text-[7px] text-[#7a8984]">Nom du réseau</span>
              <span className="text-[10px] font-bold">{demoProperty.wifiName}</span>
            </span>
            {copiedValue === 'network' ? (
              <Check className="h-3.5 w-3.5 text-[#367566]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#367566]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => copyValue(demoProperty.wifiPassword, 'password')}
            className="mt-1.5 flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left"
          >
            <span>
              <span className="block text-[7px] text-[#7a8984]">Mot de passe</span>
              <span className="text-[10px] font-bold">
                {copiedValue === 'password' ? 'Copié !' : demoProperty.wifiPassword}
              </span>
            </span>
            {copiedValue === 'password' ? (
              <Check className="h-3.5 w-3.5 text-[#367566]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#367566]" />
            )}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-[1.35rem] border border-[#142c3f]/9 bg-white">
          <div className="border-r border-[#142c3f]/8 p-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#d9694d]">
              Arrivée
            </p>
            <p className="mt-1.5 text-sm font-bold">À partir de 15 h</p>
            <p className="mt-1 text-[8px] text-[#7b858b]">Accès autonome</p>
          </div>
          <div className="p-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#367566]">
              Départ
            </p>
            <p className="mt-1.5 text-sm font-bold">Avant 11 h</p>
            <p className="mt-1 text-[8px] text-[#7b858b]">5 étapes simples</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => copyValue('4567#', 'access')}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-[#102a3d] px-3 py-2.5 text-white"
        >
          <span className="flex items-center gap-2 text-[9px] font-bold">
            <KeyRound className="h-3.5 w-3.5 text-[#ffd0b8]" />
            Code d’accès
          </span>
          <span className="font-mono text-[10px] font-bold tracking-[0.14em]">
            {copiedValue === 'access' ? 'COPIÉ' : '4567#'}
          </span>
        </button>
      </div>
    );
  }

  if (screen === 'equipment') {
    const selectedGuide =
      equipmentGuides.find((guide) => guide.name === selectedEquipment) ??
      equipmentGuides[0];

    return (
      <div className="h-full bg-[#fbfaf8] px-4 pb-4 pt-11 text-[#142c3f]">
        <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#d9694d]">
          Guides pratiques
        </p>
        <h3 className="mt-1 font-serif text-2xl tracking-[-0.035em]">
          Vos équipements
        </h3>
        <div className="mt-4 space-y-2">
          {equipmentGuides.map((guide) => {
            const GuideIcon = guide.icon;
            const isSelected = selectedEquipment === guide.name;

            return (
              <button
                key={guide.name}
                type="button"
                onClick={() => setSelectedEquipment(guide.name)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-[#d9694d]/35 bg-[#f7e9e3]'
                    : 'border-[#142c3f]/8 bg-white'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    isSelected
                      ? 'bg-[#d9694d] text-white'
                      : 'bg-[#f3eee8] text-[#6c777d]'
                  }`}
                >
                  <GuideIcon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-[11px] font-bold">{guide.name}</span>
                  <span className="block text-[8px] text-[#7b858b]">
                    {guide.subtitle}
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-[#8c969b]" />
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-2xl bg-[#102a3d] p-3 text-white">
          <p className="text-[8px] uppercase tracking-[0.13em] text-white/50">
            Guide sélectionné
          </p>
          <p className="mt-1 text-sm font-semibold">{selectedGuide.name}</p>
          <div className="mt-3 flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[8px] font-bold text-[#ffd0b8]"
              >
                {step}
              </span>
            ))}
            <span className="ml-1 text-[8px] text-white/55">3 étapes simples</span>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'nearby') {
    const filteredPlaces =
      nearbyFilter === 'Tout'
        ? nearbyPlaces
        : nearbyPlaces.filter((place) => place.category === nearbyFilter);
    const activePlace =
      nearbyPlaces.find((place) => place.name === selectedPlace) ?? nearbyPlaces[0];

    return (
      <div className="h-full bg-[#fbfaf8] px-4 pb-4 pt-11 text-[#142c3f]">
        <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#367566]">
          Les adresses de Marie
        </p>
        <h3 className="mt-1 font-serif text-2xl tracking-[-0.035em]">
          À proximité
        </h3>
        <div className="mt-3 flex gap-1.5">
          {['Tout', 'Restaurants', 'Cafés'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setNearbyFilter(filter)}
              aria-pressed={nearbyFilter === filter}
              className={`rounded-full px-2.5 py-1.5 text-[7px] font-bold ${
                nearbyFilter === filter
                  ? 'bg-[#102a3d] text-white'
                  : 'bg-[#f3eee8] text-[#6d787e]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {filteredPlaces.map((place, index) => (
            <button
              key={place.name}
              type="button"
              onClick={() => setSelectedPlace(place.name)}
              aria-pressed={selectedPlace === place.name}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                selectedPlace === place.name
                  ? 'border-[#d9694d]/35 bg-[#f7e9e3]'
                  : 'border-[#142c3f]/8 bg-white'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  index === 0
                    ? 'bg-[#f4e6e1] text-[#d9694d]'
                    : 'bg-[#e9f2ef] text-[#367566]'
                }`}
              >
                {index === 1 ? (
                  <Coffee className="h-4 w-4" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </span>
              <span className="flex-1">
                <span className="block text-[11px] font-bold">{place.name}</span>
                <span className="block text-[8px] text-[#7b858b]">
                  {place.type} · {place.time}
                </span>
              </span>
              <span className="flex items-center gap-1 text-[8px] font-bold text-[#d9694d]">
                <Star className="h-3 w-3 fill-current" />
                {place.rating}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-[#e8edf0] p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#d9694d]">
              <MapPin className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[8px] text-[#7b858b]">
                Adresse sélectionnée
              </span>
              <span className="block text-[10px] font-bold">
                {activePlace.name} · {activePlace.time} à pied
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#fbfaf8] px-4 pb-4 pt-11 text-[#142c3f]">
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#d9694d]">
        Dernière étape
      </p>
      <h3 className="mt-1 font-serif text-2xl tracking-[-0.035em]">
        Un départ serein
      </h3>
      <div className="mt-4 rounded-[1.5rem] border border-[#142c3f]/8 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] uppercase tracking-[0.12em] text-[#7b858b]">
              Check-out
            </p>
            <p className="mt-1 text-base font-bold">Avant 11 h</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4e6e1] text-[#d9694d]">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {[
            'Fermer toutes les fenêtres',
            'Éteindre les lumières',
            'Remettre les clés dans la boîte',
          ].map((task, index) => (
            <button
              key={task}
              type="button"
              onClick={() =>
                setDepartureTasks(
                  departureTasks.map((value, taskIndex) =>
                    taskIndex === index ? !value : value
                  )
                )
              }
              className="flex w-full items-center gap-3 rounded-xl bg-[#f7f4f0] p-2.5 text-left"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  departureTasks[index]
                    ? 'bg-[#367566] text-white'
                    : 'border border-[#142c3f]/15 text-transparent'
                }`}
              >
                <Check className="h-3 w-3" />
              </span>
              <span className="text-[10px] font-semibold">{task}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-[#102a3d] p-4 text-white">
        <p className="text-[8px] uppercase tracking-[0.12em] text-white/50">
          Merci pour votre séjour
        </p>
        <p className="mt-1 font-serif text-lg">À bientôt à Paris.</p>
      </div>
    </div>
  );
}

function OwnerDemo({
  screen,
  activeOwnerSection,
  setActiveOwnerSection,
  visibleSections,
  setVisibleSections,
  copiedValue,
  setCopiedValue,
  isPublished,
  setIsPublished,
}: {
  screen: OwnerScreen;
  activeOwnerSection: string;
  setActiveOwnerSection: (value: string) => void;
  visibleSections: Record<string, boolean>;
  setVisibleSections: (value: Record<string, boolean>) => void;
  copiedValue: string | null;
  setCopiedValue: (value: string | null) => void;
  isPublished: boolean;
  setIsPublished: (value: boolean) => void;
}) {
  if (screen === 'overview') {
    return (
      <div className="h-full overflow-hidden bg-[#f8f5f1] p-3 text-[#1f2925] sm:p-4">
        <div className="relative h-28 overflow-hidden rounded-2xl">
          <Image
            src={demoProperty.coverImage}
            alt=""
            fill
            unoptimized
            sizes="620px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute inset-x-4 bottom-3 flex items-end justify-between text-white">
            <div>
              <p className="text-[8px] uppercase tracking-[0.13em] text-white/60">
                {demoProperty.type} · {demoProperty.city}
              </p>
              <p className="mt-1 font-serif text-lg font-semibold">
                {demoProperty.name}
              </p>
            </div>
            <span className="rounded-full bg-[#367566] px-2.5 py-1 text-[7px] font-bold uppercase">
              Publié
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { icon: Eye, value: '423', label: 'Consultations' },
            { icon: Users, value: '287', label: 'Visiteurs' },
            { icon: BarChart3, value: '92%', label: 'Lecture' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#1f2925]/7 bg-white p-2.5"
            >
              <stat.icon className="h-3.5 w-3.5 text-[#d96c4a]" />
              <p className="mt-2 text-lg font-bold">{stat.value}</p>
              <p className="text-[7px] text-[#7a847e]">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-[#1f2925]/7 bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold">Livret d’accueil</p>
              <p className="mt-0.5 text-[7px] text-[#7a847e]">
                Modifié aujourd’hui
              </p>
            </div>
            <span className="text-[9px] font-bold text-[#367566]">
              {demoProperty.completion}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8e2da]">
            <div
              className="h-full rounded-full bg-[#367566]"
              style={{ width: `${demoProperty.completion}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f8f5f1] px-3 py-2">
            <span className="flex items-center gap-2 text-[8px] font-semibold">
              <BookOpen className="h-3.5 w-3.5 text-[#d96c4a]" />
              5 sections visibles
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#89918d]" />
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'editor') {
    return (
      <div className="grid h-full grid-cols-[1fr_.8fr] overflow-hidden bg-[#f8f5f1] text-[#1f2925]">
        <div className="border-r border-[#1f2925]/8 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[7px] font-bold uppercase tracking-[0.13em] text-[#d96c4a]">
                Éditeur du livret
              </p>
              <p className="mt-1 font-serif text-sm font-semibold">
                Vos sections
              </p>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d96c4a] text-white">
              <FilePenLine className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {ownerSections.map((section) => {
              const selected = activeOwnerSection === section.id;
              const visible = visibleSections[section.id];

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveOwnerSection(section.id)}
                  className={`flex w-full items-center gap-2 rounded-xl border p-2 text-left ${
                    selected
                      ? 'border-[#d96c4a]/30 bg-[#f7e9e3]'
                      : 'border-transparent bg-white'
                  }`}
                >
                  <GripVertical className="h-3 w-3 text-[#a0a7a3]" />
                  <span className="text-xs">{section.icon}</span>
                  <span className="flex-1 truncate text-[8px] font-semibold">
                    {section.label}
                  </span>
                  <span
                    role="switch"
                    aria-checked={visible}
                    onClick={(event) => {
                      event.stopPropagation();
                      setVisibleSections({
                        ...visibleSections,
                        [section.id]: !visible,
                      });
                    }}
                    className={`relative h-4 w-7 rounded-full ${
                      visible ? 'bg-[#367566]' : 'bg-[#d9d5cf]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${
                        visible ? 'left-3.5' : 'left-0.5'
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-center p-3">
          <div className="w-full rounded-2xl border border-[#1f2925]/8 bg-white p-3 shadow-sm">
            <p className="text-center text-[7px] uppercase tracking-[0.12em] text-[#89918d]">
              Aperçu voyageur
            </p>
            <div className="mt-2 rounded-xl bg-[#102a3d] p-3 text-white">
              <span className="text-xl">
                {ownerSections.find((section) => section.id === activeOwnerSection)
                  ?.icon ?? '👋'}
              </span>
              <p className="mt-3 font-serif text-sm">
                {ownerSections.find((section) => section.id === activeOwnerSection)
                  ?.label ?? 'Bienvenue'}
              </p>
              <p className="mt-1 text-[7px] text-white/50">
                Visible dans le livret public
              </p>
            </div>
            <div className="mt-2 space-y-1.5">
              <span className="block h-2 rounded-full bg-[#eee9e3]" />
              <span className="block h-2 w-3/4 rounded-full bg-[#eee9e3]" />
              <span className="block h-8 rounded-xl bg-[#e9f2ef]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'stats') {
    return (
      <div className="h-full overflow-hidden bg-[#f8f5f1] p-4 text-[#1f2925]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[7px] font-bold uppercase tracking-[0.13em] text-[#367566]">
              30 derniers jours
            </p>
            <p className="mt-1 font-serif text-lg font-semibold">
              Performances du livret
            </p>
          </div>
          <span className="rounded-lg bg-[#e9f2ef] px-2 py-1 text-[7px] font-bold text-[#367566]">
            +18 %
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ['423', 'Consultations'],
            ['287', 'Visiteurs'],
            ['92%', 'Taux de lecture'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-white p-2.5">
              <p className="text-lg font-bold">{value}</p>
              <p className="mt-0.5 text-[7px] text-[#7a847e]">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-bold">Consultations quotidiennes</p>
            <BarChart3 className="h-3.5 w-3.5 text-[#d96c4a]" />
          </div>
          <div className="mt-4 flex h-24 items-end gap-2">
            {[32, 48, 42, 68, 55, 78, 92, 71, 85, 100].map((height, index) => (
              <span
                key={index}
                className={`flex-1 rounded-t-sm ${
                  index === 9 ? 'bg-[#d96c4a]' : 'bg-[#d9e8e2]'
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[6px] text-[#a0a7a3]">
            <span>1 juil.</span>
            <span>15 juil.</span>
            <span>Aujourd’hui</span>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-[#102a3d] px-3 py-2.5 text-white">
          <p className="text-[7px] text-white/50">Section la plus consultée</p>
          <p className="mt-1 text-[10px] font-semibold">Wi-Fi · 86 % des visiteurs</p>
        </div>
      </div>
    );
  }

  const secureLink = `livret-accueil.fr/guide/${demoProperty.id}`;

  return (
    <div className="h-full overflow-hidden bg-[#f8f5f1] p-4 text-[#1f2925]">
      <p className="text-[7px] font-bold uppercase tracking-[0.13em] text-[#d96c4a]">
        Diffusion du livret
      </p>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <p className="font-serif text-lg font-semibold">Prêt à accueillir</p>
          <p className="mt-0.5 text-[7px] text-[#7a847e]">
            {demoProperty.name}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[7px] font-bold uppercase ${
            isPublished
              ? 'bg-[#e9f2ef] text-[#367566]'
              : 'bg-[#f4e6e1] text-[#d9694d]'
          }`}
        >
          {isPublished ? 'Publié' : 'Brouillon'}
        </span>
      </div>
      <div className="mt-4 rounded-2xl border border-[#1f2925]/8 bg-white p-3">
        <p className="text-[8px] font-bold">Lien sécurisé unique</p>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard?.writeText(secureLink);
            } finally {
              setCopiedValue('owner-link');
            }
          }}
          className="mt-2 flex w-full items-center justify-between rounded-xl bg-[#f8f5f1] px-3 py-2.5 text-left"
        >
          <span className="max-w-[80%] truncate text-[8px] font-semibold text-[#5f6a64]">
            {copiedValue === 'owner-link' ? 'Lien copié !' : secureLink}
          </span>
          {copiedValue === 'owner-link' ? (
            <Check className="h-3.5 w-3.5 text-[#367566]" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-[#d96c4a]" />
          )}
        </button>
      </div>
      <div className="mt-3 rounded-2xl border border-[#1f2925]/8 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e9f2ef] text-[#367566]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold">Accès privé</p>
              <p className="text-[7px] text-[#7a847e]">Lien actif et sécurisé</p>
            </div>
          </div>
          <CheckCircle2 className="h-4 w-4 text-[#367566]" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setIsPublished(!isPublished)}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[9px] font-bold text-white transition ${
          isPublished ? 'bg-[#102a3d]' : 'bg-[#d96c4a]'
        }`}
      >
        <Send className="h-3.5 w-3.5" />
        {isPublished ? 'Mettre à jour le livret' : 'Publier le livret'}
      </button>
      <p className="mt-3 text-center text-[7px] text-[#89918d]">
        Toutes les modifications sont sauvegardées automatiquement.
      </p>
    </div>
  );
}

export default function AnimatedGuestJourney() {
  const [demoMode] = useState<DemoMode>('traveler');
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState('Télévision');
  const [departureTasks, setDepartureTasks] = useState([true, false, false]);
  const [nearbyFilter, setNearbyFilter] = useState('Tout');
  const [selectedPlace, setSelectedPlace] = useState(nearbyPlaces[0].name);
  const [activeOwnerSection, setActiveOwnerSection] = useState('welcome');
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(
    Object.fromEntries(ownerSections.map((section) => [section.id, true]))
  );
  const [isPublished, setIsPublished] = useState(true);
  const reduceMotion = useReducedMotion();
  const screens = demoMode === 'traveler' ? travelerScreens : ownerScreens;
  const currentScreen = screens[activeStep];
  const travelerNav = [
    { id: 0, label: 'Accueil', icon: Home },
    { id: 1, label: 'Infos', icon: KeyRound },
    { id: 2, label: 'Guides', icon: BookOpen },
    { id: 3, label: 'Explorer', icon: Navigation },
    { id: 4, label: 'Départ', icon: CheckCircle2 },
  ];

  const selectStep = (nextStep: number) => {
    const clampedStep = Math.min(screens.length - 1, Math.max(0, nextStep));
    if (clampedStep === activeStep) return;

    setDirection(clampedStep > activeStep ? 1 : -1);
    setActiveStep(clampedStep);
  };

  return (
    <section
      className="overflow-clip bg-[linear-gradient(180deg,#fff_0%,#fff_62%,#faf7f2_100%)] px-5 pb-12 pt-20 sm:px-8 sm:py-24 lg:py-32"
      aria-labelledby="product-demo-title"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1f2925]/9 bg-[#f8f3ec] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#6e7c73]">
            <Sparkles className="h-3.5 w-3.5 text-[#d96c4a]" />
            Démonstration voyageur
          </div>
          <h2
            id="product-demo-title"
            className="type-section mt-5 text-balance font-serif leading-[1.02] tracking-[-0.04em] text-[#1f2925]"
          >
            Découvrez le livret{' '}
            <span className="italic text-[#d96c4a]">comme un voyageur.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#69716d] sm:text-lg">
            Explorez les informations utiles de L’Atelier des Batignolles et
            testez une expérience fidèle au véritable livret de séjour.
          </p>
        </div>

        <motion.div
          className="mx-auto mt-7 max-w-md text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d96c4a]">
            Démonstration interactive
          </p>
          <p className="mt-2 font-serif text-2xl tracking-[-0.025em] text-[#1f2925]">
            Testez le livret de votre logement
          </p>
          <p className="mt-2 text-xs leading-5 text-[#748079]">
            Glissez l’écran et testez les informations utiles du séjour.
          </p>
          <motion.svg
            viewBox="0 0 74 58"
            className="mx-auto -mb-1 mt-1 h-14 w-16 overflow-visible text-[#d96c4a]"
            fill="none"
            aria-hidden="true"
            animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M18 4C31 13 40 25 39 43M29 35L39 45L50 36"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.div>

        <div
          className="relative mx-auto max-w-[1040px] overflow-hidden rounded-[2.5rem] border border-[#1f2925]/8 bg-[#f7f3ed] shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_28px_80px_rgba(31,41,37,.08)] sm:rounded-[3.5rem]"
          style={{ height: 'clamp(600px, 132vw, 690px)' }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,.98),rgba(255,255,255,.3)_45%,transparent_72%)]" />
          <div className="pointer-events-none absolute -left-16 top-28 h-48 w-48 rounded-full border border-[#d96c4a]/10" />
          <div className="pointer-events-none absolute -right-20 top-12 h-64 w-64 rounded-full border border-[#367566]/10" />

          <div className="absolute inset-x-5 top-5 z-40 flex items-center justify-between sm:inset-x-8 sm:top-7">
            <div className="flex items-center gap-2 rounded-full border border-[#1f2925]/8 bg-white/88 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.13em] text-[#69736e] shadow-sm backdrop-blur-md sm:text-[9px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#66a77d] shadow-[0_0_0_3px_rgba(102,167,125,.15)]" />
              {demoMode === 'traveler' ? 'Vue voyageur' : 'Espace propriétaire'}
            </div>
            <div className="rounded-full border border-[#1f2925]/8 bg-white/75 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.12em] text-[#758079] backdrop-blur-md sm:text-[9px]">
              {String(activeStep + 1).padStart(2, '0')} /{' '}
              {String(screens.length).padStart(2, '0')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => selectStep(activeStep - 1)}
            disabled={activeStep === 0}
            aria-label="Écran précédent"
            className="absolute left-3 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#1f2925]/10 bg-white/90 text-[#1f2925] shadow-md backdrop-blur transition hover:-translate-x-0.5 disabled:opacity-25 sm:left-6"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => selectStep(activeStep + 1)}
            disabled={activeStep === screens.length - 1}
            aria-label="Écran suivant"
            className="absolute right-3 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#1f2925]/10 bg-white/90 text-[#1f2925] shadow-md backdrop-blur transition hover:translate-x-0.5 disabled:opacity-25 sm:right-6"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <AnimatePresence mode="wait">
            {demoMode === 'traveler' ? (
              <motion.div
                key="traveler-device"
                className="absolute left-1/2 top-16 z-30 -translate-x-1/2 sm:top-20"
                style={{
                  width: 'clamp(250px, 58vw, 292px)',
                  height: 'clamp(470px, 112vw, 550px)',
                }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
              >
                <span className="absolute -left-1.5 top-28 h-16 w-1.5 rounded-l-md bg-[#27322d]" />
                <span className="absolute -left-1.5 top-52 h-10 w-1.5 rounded-l-md bg-[#27322d]" />
                <span className="absolute -right-1.5 top-40 h-20 w-1.5 rounded-r-md bg-[#27322d]" />
                <div className="relative h-full rounded-[3.1rem] bg-[linear-gradient(145deg,#45534c,#15201b_18%,#090d0b_72%,#36433d)] p-[7px] shadow-[0_42px_90px_rgba(31,41,37,.3),0_12px_28px_rgba(31,41,37,.18)]">
                  <div className="relative h-full overflow-hidden rounded-[2.7rem] bg-[#fbfaf8]">
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 z-50 flex h-9 items-center justify-between px-5 ${
                        travelerScreens[activeStep].id === 'welcome'
                          ? 'text-white'
                          : 'text-[#142c3f]'
                      }`}
                    >
                      <span className="text-[8px] font-bold">9:41</span>
                      <span className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
                      <span className="flex items-center gap-1">
                        <Wifi className="h-2.5 w-2.5" />
                        <BatteryMedium className="h-3 w-3" />
                      </span>
                    </div>
                    <AnimatePresence initial={false} mode="sync">
                      <motion.div
                        key={travelerScreens[activeStep].id}
                        className="absolute inset-0"
                        initial={
                          reduceMotion
                            ? false
                            : { x: direction > 0 ? '100%' : '-100%' }
                        }
                        animate={{ x: 0 }}
                        exit={{ x: direction > 0 ? '-32%' : '32%' }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.62,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        drag={reduceMotion ? false : 'x'}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.12}
                        onDragEnd={(_, info) => {
                          if (info.offset.x < -40) selectStep(activeStep + 1);
                          if (info.offset.x > 40) selectStep(activeStep - 1);
                        }}
                        aria-label={`Démo voyageur : ${currentScreen.title}`}
                      >
                        <TravelerDemo
                          screen={travelerScreens[activeStep].id}
                          copiedValue={copiedValue}
                          setCopiedValue={setCopiedValue}
                          selectedEquipment={selectedEquipment}
                          setSelectedEquipment={setSelectedEquipment}
                          departureTasks={departureTasks}
                          setDepartureTasks={setDepartureTasks}
                          nearbyFilter={nearbyFilter}
                          setNearbyFilter={setNearbyFilter}
                          selectedPlace={selectedPlace}
                          setSelectedPlace={setSelectedPlace}
                        />
                      </motion.div>
                    </AnimatePresence>
                    <div className="absolute bottom-3 left-3 right-3 z-[45] rounded-[1.45rem] border border-[#142c3f]/8 bg-white/95 px-3 pb-2.5 pt-2 shadow-[0_10px_28px_rgba(20,44,63,.13)] backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        {travelerNav.map((item) => {
                          const active = activeStep === item.id;
                          const NavIcon = item.icon;
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => selectStep(item.id)}
                              aria-label={`Ouvrir ${item.label}`}
                              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 transition ${active ? 'text-[#d9694d]' : 'text-[#89959a]'}`}
                            >
                              <span className={`flex h-5 w-5 items-center justify-center rounded-md transition ${active ? 'bg-[#fbe8df]' : ''}`}><NavIcon className="h-3 w-3" /></span>
                              <span className="max-w-10 truncate text-[5.5px] font-bold">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <span className="mx-auto mt-2 block h-1 w-20 rounded-full bg-[#15221e]" />
                    </div>
                    <div className="pointer-events-none absolute inset-0 z-40 rounded-[2.7rem] bg-[linear-gradient(115deg,rgba(255,255,255,.13),transparent_24%,transparent_76%,rgba(255,255,255,.06))]" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="owner-device"
                className="absolute left-1/2 top-24 z-30 -translate-x-1/2 overflow-hidden rounded-[1.8rem] border-[6px] border-[#1f2925] bg-[#1f2925] shadow-[0_38px_90px_rgba(31,41,37,.25)] sm:top-28"
                style={{
                  width: 'clamp(300px, 82vw, 720px)',
                  height: 'clamp(430px, 72vw, 500px)',
                }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex h-8 items-center justify-between bg-[#1f2925] px-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#d96c4a]" />
                    <span className="h-2 w-2 rounded-full bg-[#e8c36b]" />
                    <span className="h-2 w-2 rounded-full bg-[#67a67d]" />
                  </div>
                  <span className="text-[7px] font-semibold text-white/45">
                    espace propriétaire
                  </span>
                </div>
                <div className="grid h-[calc(100%-2rem)] grid-cols-[42px_1fr] overflow-hidden rounded-b-[1.35rem] bg-[#f8f5f1] sm:grid-cols-[150px_1fr]">
                  <aside className="bg-[#17191c] p-2 text-white sm:p-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d96c4a] font-serif italic">
                      L
                    </div>
                    <div className="mt-5 space-y-2">
                      {[
                        LayoutDashboard,
                        Home,
                        BookOpen,
                        BarChart3,
                      ].map((SidebarIcon, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 rounded-lg p-2 ${
                            index === activeStep ? 'bg-white/12' : 'text-white/45'
                          }`}
                        >
                          <SidebarIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden text-[8px] sm:block">
                            {['Tableau de bord', 'Logements', 'Livrets', 'Statistiques'][index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </aside>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex h-11 items-center justify-between border-b border-[#1f2925]/8 bg-white px-3">
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-bold">
                          {ownerScreens[activeStep].title}
                        </p>
                        <p className="truncate text-[6px] text-[#89918d]">
                          {demoProperty.name}
                        </p>
                      </div>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e9f2ef] text-[7px] font-bold text-[#367566]">
                        MD
                      </span>
                    </div>
                    <div className="relative flex-1 overflow-hidden">
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.div
                          key={ownerScreens[activeStep].id}
                          className="absolute inset-0"
                          initial={
                            reduceMotion
                              ? false
                              : { x: direction > 0 ? '100%' : '-100%' }
                          }
                          animate={{ x: 0 }}
                          exit={{ x: direction > 0 ? '-30%' : '30%' }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.58,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          drag={reduceMotion ? false : 'x'}
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.1}
                          onDragEnd={(_, info) => {
                            if (info.offset.x < -40) selectStep(activeStep + 1);
                            if (info.offset.x > 40) selectStep(activeStep - 1);
                          }}
                          aria-label={`Démo propriétaire : ${currentScreen.title}`}
                        >
                          <OwnerDemo
                            screen={ownerScreens[activeStep].id}
                            activeOwnerSection={activeOwnerSection}
                            setActiveOwnerSection={setActiveOwnerSection}
                            visibleSections={visibleSections}
                            setVisibleSections={setVisibleSections}
                            copiedValue={copiedValue}
                            setCopiedValue={setCopiedValue}
                            isPublished={isPublished}
                            setIsPublished={setIsPublished}
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-2 z-40 flex flex-col items-center gap-3 sm:bottom-4">
            {demoMode === 'owner' && (
              <div className="flex items-center justify-center gap-2">
                {screens.map((screen, index) => (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => selectStep(index)}
                    aria-label={`Afficher ${screen.title}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      activeStep === index
                        ? 'w-8 bg-[#d96c4a]'
                        : 'w-1.5 bg-[#1f2925]/15 hover:bg-[#1f2925]/30'
                    }`}
                  />
                ))}
              </div>
            )}
            <p className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.15em] text-[#89918d]">
              <MessageCircle className="h-3 w-3 text-[#d9694d]" /> Touchez ou glissez pour explorer
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
