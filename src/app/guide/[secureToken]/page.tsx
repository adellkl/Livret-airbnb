'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Coffee,
  Copy,
  ExternalLink,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Play,
  ShieldCheck,
  Smartphone,
  Star,
  Thermometer,
  Send,
  Utensils,
  Wifi,
  Wind,
  X,
} from 'lucide-react';
import {
  DEFAULT_OWNER_PROPERTIES,
  type OwnerProperty,
} from '@/lib/owner-properties';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

type CityVisual = {
  image: string;
  imagePosition: string;
  hostAvatar: string;
};

const CITY_VISUALS: Record<string, CityVisual> = {
  paris: {
    image:
      'https://unsplash.com/photos/wAScP0OY-yM/download?force=true&w=1800',
    imagePosition: '50% 44%',
    hostAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=85',
  },
  nice: {
    image:
      'https://unsplash.com/photos/mpVZVCClgac/download?force=true&w=1800',
    imagePosition: '50% 48%',
    hostAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=85',
  },
  lyon: {
    image:
      'https://images.unsplash.com/photo-1682249301492-c117bddca579?auto=format&fit=crop&w=1800&q=88',
    imagePosition: '50% 50%',
    hostAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=85',
  },
  marseille: {
    image:
      'https://images.unsplash.com/photo-1608037580875-df901b196878?auto=format&fit=crop&w=1800&q=88',
    imagePosition: '50% 50%',
    hostAvatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=320&q=85',
  },
};

function getCityVisual(property: OwnerProperty): CityVisual {
  const normalizedCity = property.city.trim().toLocaleLowerCase('fr');

  return (
    CITY_VISUALS[normalizedCity] ?? {
      image: property.coverImage,
      imagePosition: '50% 50%',
      hostAvatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=85',
    }
  );
}

const fallbackEquipmentCards = [
  {
    title: 'Télévision',
    subtitle: 'Guide rapide',
    icon: Play,
    description:
      'La Smart TV donne accès à Netflix, YouTube et aux chaînes françaises. Utilisez la télécommande noire posée sur le meuble.',
    steps: ['Allumez avec le bouton rouge', 'Sélectionnez « Smart Hub »', 'Choisissez votre application'],
    image:
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=700&h=700&fit=crop',
  },
  {
    title: 'Machine à café',
    subtitle: 'Capsules fournies',
    icon: Coffee,
    description:
      'La machine Nespresso est prête à l’emploi. Les capsules et les tasses sont rangées dans le tiroir juste dessous.',
    steps: ['Remplissez le réservoir', 'Insérez une capsule', 'Appuyez sur la tasse souhaitée'],
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&h=700&fit=crop',
  },
  {
    title: 'Chauffage',
    subtitle: 'Réglage à 21 °C',
    icon: Thermometer,
    description:
      'Le thermostat se trouve dans l’entrée. Pour votre confort, la température conseillée est de 21 °C.',
    steps: ['Touchez l’écran', 'Réglez avec + ou −', 'Patientez quelques minutes'],
    image:
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=700&h=700&fit=crop',
  },
  {
    title: 'Lave-linge',
    subtitle: 'Programme rapide',
    icon: Wind,
    description:
      'Le lave-linge est installé dans le placard de la salle de bain. Une dose de lessive est à votre disposition.',
    steps: ['Chargez le linge', 'Ajoutez une dose', 'Choisissez le programme 30 min'],
    image:
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=700&h=700&fit=crop',
  },
  {
    title: 'Plaques de cuisson',
    subtitle: 'Induction',
    icon: Utensils,
    description:
      'Les plaques à induction se commandent avec les touches tactiles situées sur la partie avant.',
    steps: ['Posez une casserole', 'Maintenez Marche 2 secondes', 'Réglez la puissance'],
    image:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=700&h=700&fit=crop',
  },
  {
    title: 'Climatisation',
    subtitle: 'Mode silencieux',
    icon: Wind,
    description:
      'La télécommande blanche pilote la climatisation du salon. Fermez les fenêtres avant de l’allumer.',
    steps: ['Appuyez sur Marche', 'Choisissez le mode froid', 'Réglez à 23 °C'],
    image:
      'https://images.unsplash.com/photo-1631545806609-4b4e4d55a8a2?w=700&h=700&fit=crop',
  },
];

type EquipmentCard = (typeof fallbackEquipmentCards)[number];

type NearbyFilter = string;

type GuideMessage = {
  id: string;
  content: string;
  senderRole: 'guest' | 'owner';
  moderationStatus: 'pending' | 'approved';
  createdAt: Date | null;
};

const checkoutTasks = [
  'Fermer toutes les fenêtres',
  'Éteindre les lumières',
  'Vider le réfrigérateur',
  'Sortir les poubelles',
  'Remettre les clés dans la boîte',
];

export default function PublicBookletPage() {
  const params = useParams<{ secureToken: string }>();
  const [property, setProperty] = useState<OwnerProperty>(
    DEFAULT_OWNER_PROPERTIES[0]
  );
  const [ownerId, setOwnerId] = useState('');
  const [guideState, setGuideState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [copied, setCopied] = useState<'network' | 'password' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [checkedTasks, setCheckedTasks] = useState<number[]>([]);
  const [activeArea, setActiveArea] = useState<'booklet' | 'nearby'>('booklet');
  const [nearbyFilter, setNearbyFilter] = useState<NearbyFilter>('Tout');
  const [departureMode, setDepartureMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<
    EquipmentCard | null
  >(null);
  const [isClosingEquipment, setIsClosingEquipment] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [guestId, setGuestId] = useState('');
  const [chatMessages, setChatMessages] = useState<GuideMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatError, setChatError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const equipmentGuideRef = useRef<HTMLDivElement>(null);
  const nearbyPlacesRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroBackdropRef = useRef<HTMLDivElement>(null);
  const heroFocusRef = useRef<HTMLDivElement>(null);
  const heroFooterRef = useRef<HTMLDivElement>(null);
  const equipmentGuideOpen = selectedEquipment !== null;
  const propertyNearbyPlaces = (property.nearbyPlaces ?? []).map((place, index) => ({
    ...place,
    filter: place.category || 'Autre',
    distance: place.address || 'Adresse recommandée',
    rating: place.note || '★',
    image: property.gallery?.[index]?.url || getCityVisual(property).image,
  }));
  const guideNearbyFilters = ['Tout', ...Array.from(new Set(propertyNearbyPlaces.map((place) => place.filter)))];
  const visibleNearbyPlaces =
    nearbyFilter === 'Tout'
      ? propertyNearbyPlaces
      : propertyNearbyPlaces.filter((place) => place.filter === nearbyFilter);
  const cityVisual = getCityVisual(property);
  const heroImage = property.coverImage.trim() || property.gallery?.find((photo) => photo.url.trim())?.url.trim() || cityVisual.image;
  const hostAvatar = property.hostAvatarUrl?.trim() || cityVisual.hostAvatar;
  const equipmentCards: EquipmentCard[] = (property.equipmentGuides ?? [])
    .filter((equipment) => equipment.name.trim() && equipment.imageUrl.trim())
    .map((equipment) => ({
      title: equipment.name,
      subtitle: 'Guide de votre hôte',
      icon: Coffee,
      description: equipment.instructions || 'Les indications de votre hôte sont à retrouver dans ce guide.',
      steps: equipment.instructions ? [equipment.instructions] : ['Consultez les indications de votre hôte.'],
      image: equipment.imageUrl,
    }));
  const hostFirstName = property.hostName.split(' ')[0] || property.hostName;
  const guideFaqs = property.faqItems?.length
    ? property.faqItems.map((question) => ({ question, answer: `Pour cette information, contactez ${hostFirstName || 'votre hôte'} si besoin.` }))
    : [];
  const compactPhone = property.hostPhone.replace(/\s/g, '');
  const whatsappPhone = property.hostPhone.replace(/\D/g, '');
  const fullAddress = `${property.address}, ${property.postalCode} ${property.city}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const themeAccent =
    property.theme === 'ocean'
      ? '#287a9e'
      : property.theme === 'sage'
        ? '#367566'
        : property.accentColor || '#d9694d';

  useEffect(() => {
    let active = true;
    const loadGuide = async () => {
      try {
        const guide = await getDoc(doc(firestore, 'public_guides', params.secureToken));
        if (!active) return;
        const isOwnerPreview = new URLSearchParams(window.location.search).get('preview') === '1';
        if (!guide.exists() || (guide.data().status !== 'published' && !isOwnerPreview)) {
          setGuideState('missing');
          return;
        }
      const data = guide.data();
      setOwnerId(String(data.ownerId ?? ''));
      setProperty({
        ...DEFAULT_OWNER_PROPERTIES[0],
        id: guide.id,
        name: String(data.name ?? ''), type: String(data.type ?? ''), address: String(data.address ?? ''),
        city: String(data.city ?? ''), postalCode: String(data.postalCode ?? ''), capacity: Number(data.capacity ?? 0),
        checkIn: String(data.checkIn ?? ''), checkOut: String(data.checkOut ?? ''), wifiName: String(data.wifiName ?? ''),
        wifiPassword: String(data.wifiPassword ?? ''), description: String(data.description ?? ''),
        hostName: String(data.hostName ?? ''), hostAvatarUrl: String(data.hostAvatarUrl ?? ''), hostPhone: String(data.hostPhone ?? ''), hostEmail: String(data.hostEmail ?? ''),
        coverImage: String(data.coverImage ?? ''), arrivalInstructions: String(data.arrivalInstructions ?? ''),
        accessCode: String(data.accessCode ?? ''), parkingInstructions: String(data.parkingInstructions ?? ''),
        departureInstructions: String(data.departureInstructions ?? ''), welcomeTitle: String(data.welcomeTitle ?? ''), accentColor: String(data.accentColor ?? '#d85b24'),
        amenities: Array.isArray(data.amenities) ? data.amenities.map(String) : [],
        equipmentGuides: Array.isArray(data.equipmentGuides) ? data.equipmentGuides.map((item) => ({ name: String(item?.name ?? ''), instructions: String(item?.instructions ?? ''), imageUrl: String(item?.imageUrl ?? '') })) : [],
        houseRules: Array.isArray(data.houseRules) ? data.houseRules.map(String) : [],
        faqItems: Array.isArray(data.faqItems) ? data.faqItems.map(String) : [],
        nearbyPlaces: Array.isArray(data.nearbyPlaces) ? data.nearbyPlaces.map((place) => ({ name: String(place?.name ?? ''), category: String(place?.category ?? ''), address: String(place?.address ?? ''), note: String(place?.note ?? '') })) : [],
        gallery: Array.isArray(data.gallery) ? data.gallery.map((photo) => ({ url: String(photo?.url ?? ''), caption: String(photo?.caption ?? '') })).filter((photo) => photo.url) : [],
        welcomeSubtitle: String(data.welcomeSubtitle ?? ''),
        hostMessage: String(data.hostMessage ?? ''),
        theme: data.theme === 'ocean' || data.theme === 'sage' ? data.theme : 'terra',
        language: data.language === 'en' ? 'en' : 'fr',
        showWifi: data.showWifi !== false,
        showMap: data.showMap !== false,
        showFaq: data.showFaq !== false,
        showGallery: data.showGallery !== false,
      });
      setGuideState('ready');
      } catch {
        if (active) setGuideState('missing');
      }
    };
    void loadGuide();
    return () => { active = false; };
  }, [params.secureToken]);

  useEffect(() => {
    if (!chatOpen || !property.id) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const startConversation = async () => {
      try {
        const currentUser = firebaseAuth.currentUser ?? (await signInAnonymously(firebaseAuth)).user;
        if (!active) return;
        setGuestId(currentUser.uid);
        unsubscribe = onSnapshot(
          query(collection(firestore, 'guide_messages'), where('guestId', '==', currentUser.uid)),
          (snapshot) => {
            if (!active) return;
            setChatMessages(snapshot.docs
              .map((message) => ({
                id: message.id,
                content: String(message.data().content ?? ''),
                senderRole: message.data().senderRole === 'owner' ? 'owner' as const : 'guest' as const,
                moderationStatus: message.data().moderationStatus === 'approved' ? 'approved' as const : 'pending' as const,
                createdAt: message.data().createdAt?.toDate?.() ?? null,
                propertyId: String(message.data().propertyId ?? ''),
              }))
              .filter((message) => message.propertyId === property.id)
              .sort((first, second) => (first.createdAt?.getTime() ?? 0) - (second.createdAt?.getTime() ?? 0)));
          },
          () => setChatError('Impossible de charger la conversation pour le moment.'),
        );
      } catch {
        if (active) setChatError('La messagerie n’est pas disponible pour le moment.');
      }
    };

    void startConversation();
    return () => { active = false; unsubscribe?.(); };
  }, [chatOpen, property.id]);

  useEffect(() => {
    if (!ownerId || !params.secureToken) return;
    const eventType = new URLSearchParams(window.location.search).get('source') === 'qr' ? 'qr_scan' : 'view';
    void addDoc(collection(firestore, 'guide_events'), { propertyId: property.id, ownerId, eventType, occurredAt: serverTimestamp() }).catch(() => undefined);
  }, [ownerId, params.secureToken, property.id]);

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(window.location.href, {
      width: 360,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#142c3f',
        light: '#ffffff',
      },
    }).then((dataUrl) => {
      if (active) setQrCodeUrl(dataUrl);
    });

    return () => {
      active = false;
    };
  }, [params.secureToken]);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    let animationFrame = 0;

    const updateHero = () => {
      animationFrame = 0;
      setHeaderScrolled(window.scrollY > 72);

      if (reduceMotion || !heroSectionRef.current) return;

      const section = heroSectionRef.current;
      const travel = Math.min(
        Math.max(-section.getBoundingClientRect().top, 0),
        section.offsetHeight
      );
      const progress = Math.min(travel / section.offsetHeight, 1);

      if (heroBackdropRef.current) {
        heroBackdropRef.current.style.transform = `translate3d(0, ${
          travel * 0.22
        }px, 0) scale(${1.08 + progress * 0.04})`;
      }

      if (heroFocusRef.current) {
        heroFocusRef.current.style.transform = `translate3d(0, ${
          travel * 0.12
        }px, 0) scale(${1 - progress * 0.045})`;
        heroFocusRef.current.style.opacity = String(1 - progress * 0.76);
      }

      if (heroFooterRef.current) {
        heroFooterRef.current.style.transform = `translate3d(0, ${
          travel * 0.07
        }px, 0)`;
        heroFooterRef.current.style.opacity = String(1 - progress * 0.48);
      }
    };

    const requestHeroUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateHero);
    };

    updateHero();
    window.addEventListener('scroll', requestHeroUpdate, { passive: true });
    window.addEventListener('resize', requestHeroUpdate);
    return () => {
      window.removeEventListener('scroll', requestHeroUpdate);
      window.removeEventListener('resize', requestHeroUpdate);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    if (!equipmentGuideOpen) return;

    const scrollPosition = window.scrollY;
    const previousStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      scrollBehavior: document.documentElement.style.scrollBehavior,
    };

    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previousStyles.overflow;
      document.body.style.position = previousStyles.position;
      document.body.style.top = previousStyles.top;
      document.body.style.width = previousStyles.width;
      window.scrollTo(0, scrollPosition);
      document.documentElement.style.scrollBehavior =
        previousStyles.scrollBehavior;
    };
  }, [equipmentGuideOpen]);

  useEffect(() => {
    nearbyPlacesRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [nearbyFilter]);

  const copyValue = async (
    value: string,
    type: 'network' | 'password'
  ) => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const scrollTo = (id: 'welcome' | 'nearby') => {
    setActiveArea(id === 'welcome' ? 'booklet' : 'nearby');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleTask = (index: number) => {
    setCheckedTasks((current) =>
      current.includes(index)
        ? current.filter((task) => task !== index)
        : [...current, index]
    );
  };

  const startDeparture = () => {
    setDepartureMode(true);
    window.setTimeout(() => {
      document
        .getElementById('departure')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const openEquipmentGuide = (
    equipment: EquipmentCard
  ) => {
    setIsClosingEquipment(false);
    setSelectedEquipment(equipment);
    window.setTimeout(() => {
      equipmentGuideRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const closeEquipmentGuide = () => {
    setIsClosingEquipment(true);
    window.setTimeout(() => {
      setSelectedEquipment(null);
      setIsClosingEquipment(false);
    }, 240);
  };

  const sendMessage = async () => {
    const content = chatDraft.trim();
    if (!content || !guestId || !ownerId) return;
    if (content.length > 1000) {
      setChatError('Votre message ne peut pas dépasser 1 000 caractères.');
      return;
    }
    if (/https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[^\s@]+|(?:\+?\d[\s.-]?){8,}/i.test(content)) {
      setChatError('Pour votre sécurité, les liens, e-mails et numéros sont bloqués dans la messagerie.');
      return;
    }
    setSendingMessage(true);
    setChatError('');
    try {
      await addDoc(collection(firestore, 'guide_messages'), {
        propertyId: property.id,
        propertyName: property.name,
        ownerId,
        guestId,
        guestName: 'Voyageur',
        senderRole: 'guest',
        content,
        moderationStatus: 'pending',
        createdAt: serverTimestamp(),
      });
      setChatDraft('');
    } catch {
      setChatError('Votre message n’a pas pu être envoyé. Réessayez dans un instant.');
    } finally {
      setSendingMessage(false);
    }
  };

  const selectNearbyFilter = (filter: NearbyFilter) => {
    setNearbyFilter(filter);
  };

  if (guideState === 'missing') {
    return <main className="flex min-h-screen items-center justify-center bg-[#f3eee8] px-6 text-center text-[#142c3f]"><div className="max-w-md rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(20,44,63,.12)]"><Home className="mx-auto h-10 w-10 text-[#d9694d]" /><h1 className="mt-5 font-serif text-3xl font-semibold">Guide indisponible</h1><p className="mt-3 text-sm leading-6 text-[#66747a]">Ce lien n’existe pas, ou le guide de ce logement n’est pas encore publié.</p></div></main>;
  }

  if (guideState === 'loading') {
    return <main className="flex min-h-screen items-center justify-center bg-[#f3eee8] text-sm font-medium text-[#66747a]">Chargement de votre guide…</main>;
  }

  return (
    <div className="min-h-screen bg-[#f3eee8] text-[#142c3f]">
      <div className="hidden min-h-screen items-center justify-center px-8 py-12 sm:flex">
        <div className="grid w-full max-w-[980px] overflow-hidden rounded-[2.5rem] border border-[#142c3f]/8 bg-[#fbfaf8] shadow-[0_35px_100px_rgba(20,44,63,.13)] lg:grid-cols-[1.08fr_.92fr]">
          <div className="flex flex-col justify-center p-10 lg:p-16">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9694d] text-white shadow-[0_12px_28px_rgba(217,105,77,.25)]">
              <Smartphone size={25} />
            </span>
            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d9694d]">
              Une expérience pensée pour mobile
            </p>
            <h1 className="mt-4 max-w-lg font-serif text-4xl font-semibold leading-[1.05] tracking-[-0.04em] lg:text-5xl">
              Emportez votre livret avec vous.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#6f7c84]">
              Scannez ce QR code avec l’appareil photo de votre smartphone pour
              ouvrir instantanément le guide privé de {property.name}.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#f3eee8] p-4 text-sm text-[#596970]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white font-bold text-[#d9694d]">
                1
              </span>
              Aucun téléchargement ni création de compte n’est nécessaire.
            </div>
          </div>

          <div className="flex items-center justify-center bg-[#142c3f] p-10 lg:p-14">
            <div className="w-full max-w-[340px] rounded-[2rem] bg-white p-7 text-center shadow-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#7d888d]">
                Scannez pour continuer
              </p>
              <div className="relative mx-auto mt-5 aspect-square w-full overflow-hidden rounded-2xl bg-white">
                {qrCodeUrl ? (
                  <Image
                    src={qrCodeUrl}
                    alt={`QR code du livret ${property.name}`}
                    fill
                    unoptimized
                    sizes="320px"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#7d888d]">
                    Génération du QR code…
                  </div>
                )}
              </div>
              <p className="mt-4 font-serif text-xl font-semibold">{property.name}</p>
              <p className="mt-1 text-xs text-[#8a9295]">
                Lien privé et sécurisé
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto min-h-screen max-w-[560px] bg-[#fbfaf8] shadow-[0_0_60px_rgba(30,43,54,0.12)] sm:hidden">
        <main className="overflow-hidden pb-36">
          <section
            id="welcome"
            ref={heroSectionRef}
            className="relative h-[590px] scroll-mt-0 overflow-hidden rounded-b-[2.5rem] bg-[#183246] sm:h-[620px]"
          >
            <div
              ref={heroBackdropRef}
              className="absolute -inset-[8%] will-change-transform"
            >
              <Image
                src={heroImage}
                alt={`Photo de ${property.name || 'votre logement'}`}
                fill
                priority
                unoptimized
                sizes="(max-width: 560px) 100vw, 560px"
                className="animate-[fadeIn_.65s_ease-out] object-cover opacity-80 saturate-[1.04] contrast-[1.04]"
                style={{ objectPosition: property.coverImage.trim() ? '50% 50%' : cityVisual.imagePosition }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#06131c]/48 via-[#071821]/6 to-[#05141d]/92" />
              <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(8,24,34,.28),transparent_58%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,210,174,.2),transparent_31%)] mix-blend-screen" />
            </div>

            <div className="relative flex h-full flex-col px-5 pb-5 pt-5 text-white sm:px-7 sm:pb-7">
              <div
                className="fixed left-1/2 top-0 z-[100] w-full max-w-[560px] -translate-x-1/2 px-3 pt-3 sm:px-5"
              >
                <div
                  className={`flex items-center justify-between rounded-[1.25rem] border px-2 py-2 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
                    headerScrolled
                      ? 'border-[#142c3f]/8 bg-[#fbfaf8]/95 shadow-[0_14px_38px_rgba(20,44,63,.13)] backdrop-blur-xl'
                      : 'border-white/14 bg-[#10232e]/28 shadow-[0_12px_32px_rgba(2,14,21,.12)] backdrop-blur-lg'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => scrollTo('welcome')}
                    className={`flex min-w-0 items-center gap-2.5 rounded-xl pr-2 text-left transition-colors duration-300 ${
                      headerScrolled ? 'text-[#142c3f]' : 'text-white'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d9694d] font-serif text-lg italic text-white shadow-[0_7px_18px_rgba(217,105,77,.28)]">
                      L
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[205px] truncate font-serif text-[15px] font-semibold leading-tight">
                        {headerScrolled ? property.name : 'livret d’accueil'}
                      </span>
                      <span
                        className={`mt-0.5 block text-[8px] uppercase tracking-[0.14em] ${
                          headerScrolled ? 'text-[#6f7c84]' : 'text-white/58'
                        }`}
                      >
                        {headerScrolled ? `${property.city} · Livret privé` : 'Votre guide privé'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label="Choisir la langue"
                    className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all duration-300 ${
                      headerScrolled
                        ? 'border-[#142c3f]/8 bg-[#f3eee8] text-[#172b35]'
                        : 'border-white/12 bg-white/10 text-white hover:bg-white/16'
                    }`}
                  >
                    <span aria-hidden="true">{property.language === 'en' ? '🇬🇧' : '🇫🇷'}</span>
                    {property.language === 'en' ? 'EN' : 'FR'}
                    <ChevronDown
                      size={13}
                      className={headerScrolled ? 'text-[#6e777b]' : 'text-white/60'}
                    />
                  </button>
                </div>
              </div>

              <div
                ref={heroFocusRef}
                className="guest-hero-copy mt-auto flex flex-col items-start pb-5 pt-24 text-left will-change-[transform,opacity]"
              >
                <div className="guest-hero-avatar flex items-center gap-3 rounded-full border border-white/15 bg-black/18 py-1.5 pl-1.5 pr-4 backdrop-blur-lg">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white/75 bg-[#d8c8bc] shadow-lg">
                    <Image
                      src={hostAvatar}
                      alt={`Portrait de ${property.hostName}`}
                      fill
                      unoptimized
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#ffd0b8]">
                      Votre hôte
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-white">
                      {hostFirstName} vous accueille
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.22em] text-white/66">
                  Votre séjour commence ici
                </p>
                <h1 className="mt-2 max-w-[470px] font-serif font-semibold leading-[0.88] tracking-[-0.055em] drop-shadow-[0_8px_28px_rgba(0,0,0,.35)]">
                  <span className="block text-[clamp(2.75rem,11vw,4.4rem)] text-white">
                    {property.welcomeTitle || 'Bienvenue à'}
                  </span>
                  <span className="mt-1 block bg-gradient-to-r from-[#fff4ee] via-[#ffd0b8] to-[#ed9876] bg-clip-text pb-2 text-[clamp(3.35rem,14vw,5.35rem)] italic text-transparent">
                    {property.city}.
                  </span>
                </h1>
                <p className="mt-2 max-w-[390px] text-[clamp(.85rem,3.5vw,1rem)] leading-relaxed text-white/76 drop-shadow-md">
                  {property.welcomeSubtitle || property.description}
                </p>
              </div>

              <div
                ref={heroFooterRef}
                className="overflow-hidden rounded-[1.35rem] border border-white/16 bg-black/22 shadow-[0_16px_45px_rgba(2,13,20,.24)] backdrop-blur-xl will-change-[transform,opacity]"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-sm font-semibold">{property.name}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-white/55">
                      {property.type} · {property.capacity} voyageurs
                    </p>
                  </div>
                  <div
                    title="Lien privé et sécurisé"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/10 text-white/78"
                  >
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="flex items-center gap-2.5 border-t border-white/10 px-4 py-2.5 text-xs text-white/74">
                  <MapPin size={14} className="shrink-0 text-[#ffd0b8]" />
                  <span className="truncate">
                    {property.address}, {property.postalCode} {property.city}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {property.hostMessage && (
            <section className="px-5 pt-7">
              <div className="rounded-[1.7rem] border border-[#142c3f]/10 bg-white p-5 shadow-[0_12px_34px_rgba(20,44,63,.05)]" style={{ borderLeftColor: themeAccent, borderLeftWidth: 5 }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: themeAccent }}>Un mot de votre hôte</p>
                <p className="mt-3 text-sm leading-6 text-[#52636b]">{property.hostMessage}</p>
              </div>
            </section>
          )}

          {property.showWifi !== false && (
          <section className="px-5 py-7">
            <div className="overflow-hidden rounded-[2rem] border border-[#b9d1c9] bg-[#e9f2ef] p-5 shadow-[0_18px_45px_rgba(53,103,91,0.1)]">
              <div className="mb-5 flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-[#367566] text-white shadow-[0_8px_20px_rgba(54,117,102,0.22)]">
                  <Wifi size={25} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#367566]">
                    Wi-Fi de l’appartement
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#142c3f]">
                    Connectez-vous en un geste
                  </h2>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.35rem] border border-[#367566]/12 bg-white">
                <button
                  type="button"
                  onClick={() => copyValue(property.wifiName, 'network')}
                  className="flex w-full items-center justify-between border-b border-[#142c3f]/8 px-4 py-3.5 text-left"
                >
                  <span>
                    <span className="block text-[11px] font-medium text-[#7a8984]">
                      Nom du réseau
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-[#142c3f]">
                      {property.wifiName || 'À demander à votre hôte'}
                    </span>
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9f2ef] text-[#367566]">
                    {copied === 'network' ? <Check size={18} /> : <Copy size={17} />}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => copyValue(property.wifiPassword, 'password')}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <span>
                    <span className="block text-[11px] font-medium text-[#7a8984]">
                      Mot de passe
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-[#142c3f]">
                      {property.wifiPassword || 'À demander à votre hôte'}
                    </span>
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9f2ef] text-[#367566]">
                    {copied === 'password' ? <Check size={18} /> : <Copy size={17} />}
                  </span>
                </button>
              </div>
              <p className="mt-3 text-center text-[11px] text-[#657771]">
                Touchez une ligne pour copier l’information
              </p>
            </div>
          </section>
          )}

          <section className="px-5 py-7">
            <div className="mb-5">
              <p className="text-sm font-medium text-[#8b8f90]">
                Votre parcours
              </p>
              <h2 className="mt-1 whitespace-nowrap text-[clamp(1.75rem,8vw,2rem)] font-semibold tracking-[-0.035em]">
                Arrivée & départ
              </h2>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#142c3f]/9 bg-white shadow-[0_14px_40px_rgba(20,44,63,0.06)]">
              <div className="grid grid-cols-2 border-b border-[#142c3f]/8">
                <div className="min-w-0 border-r border-[#142c3f]/8 p-3 min-[390px]:p-5">
                  <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.11em] text-[#d9694d] min-[390px]:text-[11px] min-[390px]:tracking-[0.13em]">
                    Arrivée
                  </p>
                  <p className="mt-2 whitespace-nowrap text-[clamp(0.95rem,4.8vw,1.5rem)] font-semibold leading-none tracking-[-0.025em]">
                    À partir de {property.checkIn || '15:00'}
                  </p>
                  <p className="mt-2 whitespace-nowrap text-[10px] text-[#7b858b] min-[390px]:text-xs">
                    Accès autonome
                  </p>
                </div>
                <div className="min-w-0 p-3 min-[390px]:p-5">
                  <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.11em] text-[#367566] min-[390px]:text-[11px] min-[390px]:tracking-[0.13em]">
                    Départ
                  </p>
                  <p className="mt-2 whitespace-nowrap text-[clamp(0.95rem,4.8vw,1.5rem)] font-semibold leading-none tracking-[-0.025em]">
                    Avant {property.checkOut || '11:00'}
                  </p>
                  <p className="mt-2 whitespace-nowrap text-[10px] text-[#7b858b] min-[390px]:text-xs">
                    5 étapes simples
                  </p>
                </div>
              </div>

              <div className="p-4 min-[390px]:p-5">
                <h3 className="whitespace-nowrap text-base font-semibold min-[390px]:text-lg">
                  Votre arrivée en 3 étapes
                </h3>
                <div className="mt-5 space-y-4">
                  {[
                    ['01', 'Instructions d’arrivée', property.arrivalInstructions || 'Les instructions seront communiquées par votre hôte.'],
                    ['02', 'Accès au logement', property.accessCode || 'Accès à confirmer avec votre hôte.'],
                    ['03', 'Départ', property.departureInstructions || 'Merci de respecter les consignes de départ.'],
                  ].map(([number, title, description], index) => (
                    <div key={number} className="relative flex gap-4">
                      {index < 2 && (
                        <span className="absolute left-[17px] top-9 h-8 w-px bg-[#142c3f]/12" />
                      )}
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4e6e1] text-xs font-bold text-[#d9694d]">
                        {number}
                      </span>
                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-[13px] font-semibold min-[390px]:text-sm">
                          {title}
                        </p>
                        <p className="mt-0.5 whitespace-nowrap text-[11px] text-[#7b858b] min-[390px]:text-xs">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-[#f3eee8] px-2 py-3 text-[13px] font-semibold"
                  >
                    Toutes les instructions
                    <ArrowRight size={15} className="shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={startDeparture}
                    className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-[#102a3d] px-2 py-3 text-[13px] font-semibold text-white"
                  >
                    Préparer mon départ
                    <Check size={15} className="shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {property.showMap !== false && (
          <section className="px-5 py-5">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#142c3f]/9 bg-[#e8edf0] shadow-[0_12px_32px_rgba(20,44,63,0.07)]">
              <div className="relative h-[220px]">
                <iframe
                  title={`Carte interactive de ${property.name}`}
                  src={`https://www.google.com/maps?q=${encodedAddress}&output=embed`}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-[1.15rem] bg-white/95 p-3 shadow-[0_10px_30px_rgba(20,44,63,.16)] backdrop-blur">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3eee8] text-[#d9694d]">
                      <MapPin size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8b8f90]">Votre adresse</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-[#142c3f]">
                        {property.address}, {property.city}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodedAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#102a3d] text-white"
                    aria-label="Ouvrir l’adresse dans Maps"
                  >
                    <Navigation size={17} />
                  </a>
                </div>
              </div>
            </div>
          </section>
          )}

          <section className="py-7">
            <div className="mb-5 px-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#8b8f90]">Guides pratiques</p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">
                    Vos équipements
                  </h2>
                </div>
                <p className="pb-1 text-[11px] font-medium text-[#8b8f90]">
                  Faites défiler →
                </p>
              </div>
            </div>
            <div className="guest-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-2">
              {equipmentCards.map((equipment, index) => (
                <button
                  key={equipment.title}
                  type="button"
                  onClick={() => setSelectedEquipment(equipment)}
                  className="w-[286px] shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-[#142c3f]/9 bg-white text-left shadow-[0_10px_30px_rgba(20,44,63,0.06)]"
                >
                  <div className="relative h-52 overflow-hidden bg-[#ece9e5]">
                    <Image
                      src={equipment.image}
                      alt=""
                      fill
                      unoptimized
                      sizes="286px"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#687780] shadow-sm backdrop-blur">
                      Guide {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#d9694d] shadow-lg">
                      <equipment.icon size={20} fill={equipment.icon === Play ? 'currentColor' : 'none'} />
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#8b8f90]">
                          {equipment.subtitle}
                        </p>
                        <h3 className="mt-1.5 text-xl font-semibold">{equipment.title}</h3>
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3eee8] text-[#d9694d]">
                        <ChevronRight size={17} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="px-5 py-7">
            <div className="overflow-hidden rounded-[2rem] border border-[#142c3f]/8 bg-[#f6f4f1] shadow-[0_18px_45px_rgba(20,44,63,0.07)]">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8b8f90]">
                    Votre contact sur place
                  </p>
                  <span className="flex items-center gap-1 rounded-full border border-[#367566]/12 bg-white px-2.5 py-1 text-[10px] font-bold text-[#367566]">
                    <BadgeCheck size={13} />
                    Profil vérifié
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <div className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#eaded8] shadow-sm">
                    <Image
                      src={hostAvatar}
                      alt={`Portrait de ${property.hostName}`}
                      fill
                      unoptimized
                      sizes="82px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em]">{property.hostName}</h2>
                    <p className="mt-1 text-xs text-[#7b858b]">Votre hôte · {property.city}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#367566]">
                      <span className="h-2 w-2 rounded-full bg-[#48a988]" />
                      Disponible maintenant
                    </p>
                  </div>
                </div>

                <div className="my-5 h-px bg-[#142c3f]/8" />
                <p className="text-sm leading-6 text-[#5f6f79]">
                  Je reste disponible pendant tout votre séjour. Un message
                  suffit si vous avez une question ou besoin d’aide.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${compactPhone}`}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-[#142c3f]/10 bg-white px-4 py-3 text-sm font-semibold text-[#102a3d]"
                  >
                    <Phone size={17} />
                    Appeler
                  </a>
                  <a
                    href={`https://wa.me/${whatsappPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#367566] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <MessageCircle size={17} />
                    WhatsApp
                  </a>
                </div>
              </div>
              <div className="border-t border-[#142c3f]/8 bg-white/55 px-6 py-3.5 text-center text-xs text-[#7b858b]">
                Urgence médicale ou sécurité : appelez le 112
              </div>
            </div>
          </section>

          {departureMode && (
            <section id="departure" className="scroll-mt-24 px-5 py-7">
              <div className="rounded-[2rem] border border-[#d7c8bf] bg-[#f5eee9] p-5 shadow-[0_16px_38px_rgba(96,65,47,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#a75b47]">
                      Mode départ activé
                    </p>
                    <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">
                      Votre départ, étape par étape
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDepartureMode(false)}
                    aria-label="Fermer la préparation du départ"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#6f7c84]"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="mt-5 rounded-[1.35rem] bg-white p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{checkedTasks.length} sur {checkoutTasks.length} terminées</span>
                    <span className="text-[#367566]">
                      {Math.round((checkedTasks.length / checkoutTasks.length) * 100)} %
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8e5e1]">
                    <div
                      className="h-full rounded-full bg-[#367566] transition-all duration-500"
                      style={{
                        width: `${(checkedTasks.length / checkoutTasks.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-[1.35rem] border border-[#142c3f]/8 bg-white">
                  {checkoutTasks.map((task, index) => {
                    const checked = checkedTasks.includes(index);
                    return (
                      <button
                        key={task}
                        type="button"
                        onClick={() => toggleTask(index)}
                        className="flex w-full items-center gap-4 border-b border-[#142c3f]/8 px-4 py-4 text-left last:border-b-0"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                            checked
                              ? 'border-[#367566] bg-[#367566] text-white'
                              : 'border-[#d7c8bf] bg-[#faf7f4] text-[#a75b47]'
                          }`}
                        >
                          {checked ? <Check size={16} /> : index + 1}
                        </span>
                        <span className="flex-1">
                          <span
                            className={`block text-sm font-semibold transition ${
                              checked ? 'text-[#8b8f90] line-through' : ''
                            }`}
                          >
                            {task}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-[#8b8f90]">
                            {index === checkoutTasks.length - 1
                              ? 'Dernière étape avant de partir'
                              : `Étape ${index + 1}`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {checkedTasks.length === checkoutTasks.length && (
                  <div className="mt-3 flex items-center gap-3 rounded-[1.35rem] bg-[#367566] p-4 text-white">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                      <Check size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Tout est prêt !</p>
                      <p className="text-xs text-white/70">Merci et bon retour.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {property.showFaq !== false && guideFaqs.length > 0 && (
          <section className="px-5 py-7">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#8b8f90]">Besoin d’aide ?</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">
                  Les réponses utiles
                </h2>
              </div>
              <a
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank"
                rel="noreferrer"
                className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f2ef] text-[#367566]"
                aria-label={`Poser une question à ${hostFirstName}`}
              >
                <MessageCircle size={18} />
              </a>
            </div>
            <div className="overflow-hidden rounded-[1.75rem] border border-[#142c3f]/9 bg-white shadow-[0_12px_34px_rgba(20,44,63,0.05)]">
              {guideFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.question}
                    className="border-b border-[#142c3f]/8 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors ${
                        isOpen ? 'bg-[#f7f4f0]' : ''
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                            isOpen
                              ? 'bg-[#d9694d] text-white'
                              : 'bg-[#f0ece7] text-[#7b858b]'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold">{faq.question}</span>
                      </span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen
                          ? 'grid-rows-[1fr] bg-[#f7f4f0] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 pl-[60px] text-sm leading-6 text-[#6f7c84]">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          )}

          {property.showGallery !== false && property.gallery?.length ? (
            <section className="px-5 py-8">
              <p className="text-sm font-medium text-[#8b8f90]">Le logement en images</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Découvrez les espaces</h2>
              <div className="guest-scrollbar mt-5 flex snap-x gap-4 overflow-x-auto pb-2">
                {property.gallery.map((photo, index) => (
                  <figure key={`${photo.url}-${index}`} className="w-72 shrink-0 snap-start overflow-hidden rounded-[1.75rem] bg-[#f3eee8]">
                    <div className="relative aspect-[4/3]"><Image src={photo.url} alt={photo.caption || `Photo ${index + 1} du logement`} fill unoptimized sizes="288px" className="object-cover" /></div>
                    {photo.caption && <figcaption className="px-4 py-3 text-sm font-semibold text-[#142c3f]">{photo.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <section id="nearby" className="scroll-mt-24 overflow-hidden bg-white py-10 text-[#142c3f]">
            <div className="mb-5 px-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9694d]">La sélection de {hostFirstName}</p>
                  <h2 className="mt-2 font-serif text-[2rem] font-semibold tracking-[-0.035em]">
                    Le meilleur du quartier
                  </h2>
                </div>
                <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#142c3f]/9 bg-[#f3eee8] text-xs font-semibold text-[#64716b]">
                  {visibleNearbyPlaces.length}
                </span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#6f7c84]">
                Des adresses choisies avec soin, toutes accessibles à pied.
              </p>
              <div className="guest-scrollbar mt-4 flex gap-2 overflow-x-auto">
                {guideNearbyFilters.map(
                  (category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => selectNearbyFilter(category)}
                      aria-pressed={nearbyFilter === category}
                      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        nearbyFilter === category
                          ? 'border-[#d9694d] bg-[#d9694d] text-white'
                          : 'border-[#142c3f]/9 bg-[#f8f6f2] text-[#60706a] hover:bg-[#f3eee8]'
                      }`}
                    >
                      {category}
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              ref={nearbyPlacesRef}
              className="guest-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4"
            >
              {visibleNearbyPlaces.map((place, index) => (
                <article
                  key={place.name}
                  className="group relative h-[370px] w-[292px] shrink-0 snap-center animate-[fadeIn_280ms_ease-out] overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#18384e] shadow-[0_20px_50px_rgba(2,13,20,.28)]"
                >
                  <Image
                    src={place.image}
                    alt={place.name}
                    fill
                    unoptimized
                    sizes="292px"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-[#071923]/95" />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                    <span className="rounded-full border border-white/18 bg-black/22 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-lg">
                      {place.category}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1.5 text-xs font-bold text-[#142c3f] shadow">
                      <Star size={12} fill="#d9694d" className="text-[#d9694d]" />
                      {place.rating}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.17em] text-[#efad82]">
                      Adresse {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className="font-serif text-[1.7rem] font-semibold leading-tight text-white">{place.name}</h3>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="flex items-center gap-1.5 text-xs text-white/62">
                        <MapPin size={13} className="text-[#efad82]" />
                        {place.distance}
                      </p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(place.address || `${place.name} ${property.city}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center gap-2 rounded-full border border-white/14 bg-white/10 px-4 text-xs font-semibold text-white backdrop-blur transition hover:bg-white hover:text-[#102a3d]"
                      >
                        Itinéraire
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!propertyNearbyPlaces.length && <p className="px-5 pb-7 text-sm text-[#6f7c84]">Aucune bonne adresse n’a encore été ajoutée pour ce logement.</p>}
          </section>

          <section className="px-5 py-8">
            <div className="rounded-[2rem] bg-[#f3eee8] p-7 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#d9694d] shadow-sm">
                <MessageCircle size={21} />
              </div>
              <h2 className="mt-4 text-2xl font-semibold">Vous aimez votre séjour ?</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#6f7c84]">
                Votre retour aide {hostFirstName} à offrir une expérience toujours plus
                attentionnée.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} étoiles`}
                    className="text-[#d9694d]"
                  >
                    <Star size={27} />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <footer className="px-5 pb-6 pt-8">
            <div className="overflow-hidden rounded-[2rem] bg-[#102a3d] text-white shadow-[0_18px_45px_rgba(16,42,61,0.18)]">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d9694d] font-semibold text-white">
                    L
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{property.name}</p>
                    <p className="mt-0.5 text-[11px] text-white/55">
                      Votre livret d’accueil à {property.city}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-lg font-medium leading-7 text-white/92">
                  Tout est prêt pour profiter pleinement de votre séjour.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setChatError(''); setChatOpen(true); }}
                    className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-white px-3 py-3 text-xs font-semibold text-[#102a3d]"
                  >
                    <MessageCircle size={16} />
                    Écrire à {hostFirstName}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTo('welcome')}
                    className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-white/10 px-3 py-3 text-xs font-semibold text-white"
                  >
                    Retour en haut
                    <ArrowRight size={15} className="-rotate-90" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4 text-[10px] text-white/50">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <ShieldCheck size={13} className="text-[#7eb5a8]" />
                  Lien privé et sécurisé
                </span>
                <span className="whitespace-nowrap">{property.city} · 2026</span>
              </div>
            </div>
          </footer>
        </main>

        {selectedEquipment && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Guide ${selectedEquipment.title}`}
            className={`fixed inset-0 z-[70] mx-auto flex max-w-[560px] flex-col overflow-hidden overscroll-none bg-[#f4f1ed] ${isClosingEquipment ? 'guest-equipment-leave' : 'guest-equipment-enter'}`}
          >
            <div className="relative h-[30vh] min-h-[250px] shrink-0 overflow-hidden bg-[#e8e3dd]">
              <Image
                src={selectedEquipment.image}
                alt={selectedEquipment.title}
                fill
                unoptimized
                sizes="(max-width: 560px) 100vw, 560px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b2334]/90 via-[#0b2334]/10 to-black/25" />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                <button
                  type="button"
                  onClick={closeEquipmentGuide}
                  aria-label="Fermer le guide"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/95 text-[#142c3f] shadow-[0_8px_24px_rgba(15,36,50,0.16)]"
                >
                  <ArrowLeft size={21} />
                </button>
                <div className="flex items-center gap-2 rounded-full border border-white/45 bg-white/94 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#142c3f] shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d9694d]" />
                  Guide pratique
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 pb-8 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-md">
                    {String(
                      equipmentCards.findIndex(
                        (equipment) =>
                          equipment.title === selectedEquipment.title
                      ) + 1
                    ).padStart(2, '0')}{' '}
                    / {String(equipmentCards.length).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-medium text-white/75">
                    3 étapes · 2 min
                  </span>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  {selectedEquipment.subtitle}
                </p>
                <h2 className="mt-1 text-[2.15rem] font-semibold leading-tight">
                  {selectedEquipment.title}
                </h2>
              </div>
            </div>

            <div
              ref={equipmentGuideRef}
              className="guest-scrollbar -mt-5 flex-1 touch-pan-y overflow-y-auto overscroll-contain rounded-t-[2rem] bg-[#fbfaf8] px-5 pb-12 pt-7"
            >
              <section className="rounded-[1.6rem] border border-[#142c3f]/7 bg-white p-5 shadow-[0_12px_35px_rgba(20,44,63,0.06)]">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4e5df] text-[#d9694d]">
                    <selectedEquipment.icon size={21} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8f90]">
                      Bon à savoir
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#566871]">
                      {selectedEquipment.description}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-7">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d9694d]">
                      Pas à pas
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold">
                      Mode d’emploi
                    </h3>
                  </div>
                  <span className="text-xs text-[#8b8f90]">
                    {selectedEquipment.steps.length} étapes
                  </span>
                </div>

                <div className="relative mt-4 space-y-3 before:absolute before:bottom-8 before:left-[1.45rem] before:top-8 before:w-px before:bg-[#d9694d]/20">
                  {selectedEquipment.steps.map((step, index) => (
                    <div
                      key={step}
                      className="relative flex items-center gap-4 rounded-[1.35rem] border border-[#142c3f]/7 bg-white p-4 shadow-[0_8px_24px_rgba(20,44,63,0.04)]"
                    >
                      <span className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#f4e5df] text-xs font-bold text-[#d9694d]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa1a3]">
                          Étape {index + 1}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-5">
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-6 flex items-center gap-4 rounded-[1.6rem] bg-[#e6f0ed] p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#367566]">
                  <MessageCircle size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#285f53]">
                    Une question ?
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-[#58756e]">
                    {hostFirstName} vous répond rapidement.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${whatsappPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#367566] px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Écrire
                </a>
              </section>

              <section className="-mx-5 mt-9 border-t border-[#142c3f]/7 pt-7">
                <div className="flex items-end justify-between px-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8f90]">
                      Continuer
                    </p>
                    <h3 className="mt-1 text-xl font-semibold">
                      Les autres équipements
                    </h3>
                  </div>
                  <span className="text-xs text-[#8b8f90]">Faites défiler →</span>
                </div>

                <div className="guest-scrollbar mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
                  {equipmentCards
                    .filter(
                      (equipment) =>
                        equipment.title !== selectedEquipment.title
                    )
                    .map((equipment) => {
                      const EquipmentIcon = equipment.icon;

                      return (
                        <button
                          key={equipment.title}
                          type="button"
                          onClick={() => openEquipmentGuide(equipment)}
                          className="w-[190px] shrink-0 snap-start overflow-hidden rounded-[1.4rem] border border-[#142c3f]/8 bg-white text-left shadow-[0_10px_28px_rgba(20,44,63,0.06)]"
                        >
                          <div className="relative h-28 overflow-hidden bg-[#e8e3dd]">
                            <Image
                              src={equipment.image}
                              alt={equipment.title}
                              fill
                              unoptimized
                              sizes="190px"
                              className="object-cover"
                            />
                            <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#d9694d] shadow-sm">
                              <EquipmentIcon size={15} />
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 p-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {equipment.title}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-[#7b8589]">
                                {equipment.subtitle}
                              </p>
                            </div>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3eee8] text-[#d9694d]">
                              <ChevronRight size={15} />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </section>
            </div>
          </div>
        )}

        {chatOpen && (
          <div role="dialog" aria-modal="true" aria-label={`Messagerie avec ${hostFirstName}`} className="fixed inset-0 z-[80] mx-auto flex max-w-[560px] flex-col bg-[#fbfaf8]">
            <div className="flex items-center justify-between border-b border-[#142c3f]/8 bg-white px-5 py-4 shadow-sm">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d9694d]">Messagerie privée</p><h2 className="mt-1 text-lg font-semibold">Écrire à {hostFirstName}</h2></div>
              <button type="button" onClick={() => setChatOpen(false)} aria-label="Fermer la messagerie" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3eee8] text-[#142c3f]"><X size={19} /></button>
            </div>
            <div className="border-b border-[#d8e6df] bg-[#edf6f2] px-5 py-3 text-xs leading-5 text-[#39705f]"><ShieldCheck className="mr-1 inline h-4 w-4" />Vos échanges restent dans le livret. Les liens, e-mails et numéros sont filtrés pour votre sécurité.</div>
            <div className="guest-scrollbar flex-1 space-y-3 overflow-y-auto px-5 py-5">
              {!chatMessages.length && <div className="rounded-[1.5rem] border border-dashed border-[#d8d0c8] bg-white p-5 text-center text-sm leading-6 text-[#718087]">Dites bonjour à {hostFirstName}. Votre hôte recevra votre message ici.</div>}
              {chatMessages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${message.senderRole === 'guest' ? 'ml-auto bg-[#102a3d] text-white' : 'bg-white text-[#31434c] shadow-sm'}`}><p>{message.content}</p>{message.senderRole === 'guest' && message.moderationStatus === 'pending' && <p className="mt-1 text-[10px] text-white/60">En attente de validation</p>}</div>)}
            </div>
            <div className="border-t border-[#142c3f]/8 bg-white p-4"><div className="flex gap-2 rounded-[1.35rem] border border-[#dcd6cf] bg-[#fcfaf8] p-2"><textarea value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} maxLength={1000} rows={2} placeholder="Écrivez votre message…" className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-[#98a0a2]" /><button type="button" onClick={sendMessage} disabled={sendingMessage || !chatDraft.trim() || !guestId} className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl bg-[#d9694d] text-white disabled:opacity-40"><Send size={17} /></button></div>{chatError && <p role="alert" className="mt-2 text-xs text-[#b8453c]">{chatError}</p>}</div>
          </div>
        )}

        <nav className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-[520px] rounded-[1.7rem] border border-white/10 bg-[#0f1820]/95 p-1.5 text-white shadow-[0_18px_45px_rgba(15,24,32,0.32)] backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => scrollTo('welcome')}
              className={`flex items-center justify-center gap-2 rounded-[1.35rem] px-3 py-3 text-sm font-semibold transition ${
                activeArea === 'booklet'
                  ? 'bg-white text-[#142c3f]'
                  : 'text-white/60'
              }`}
            >
              <Home size={17} />
              Le livret
            </button>
            <button
              type="button"
              onClick={() => scrollTo('nearby')}
              className={`flex items-center justify-center gap-2 rounded-[1.35rem] px-3 py-3 text-sm font-semibold transition ${
                activeArea === 'nearby'
                  ? 'bg-white text-[#142c3f]'
                  : 'text-white/60'
              }`}
            >
              <MapPin size={17} />
              À proximité
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
