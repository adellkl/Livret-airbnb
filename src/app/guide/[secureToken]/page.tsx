'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
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
  Send,
  Wifi,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  DEFAULT_OWNER_PROPERTIES,
  type OwnerProperty,
} from '@/lib/owner-properties';
import { firebaseAuth, firebaseAuthReady, firestore } from '@/lib/firebase/client';
import { containsBlockedMessageTerm } from '@/lib/message-moderation';
import { formatMessageDateTime } from '@/lib/message-presentation';
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

type CityVisual = {
  image: string;
  imagePosition: string;
};

const CITY_VISUALS: Record<string, CityVisual> = {
  paris: {
    image:
      'https://unsplash.com/photos/wAScP0OY-yM/download?force=true&w=1800',
    imagePosition: '50% 44%',
  },
  nice: {
    image:
      'https://unsplash.com/photos/mpVZVCClgac/download?force=true&w=1800',
    imagePosition: '50% 48%',
  },
  lyon: {
    image:
      'https://images.unsplash.com/photo-1682249301492-c117bddca579?auto=format&fit=crop&w=1800&q=88',
    imagePosition: '50% 50%',
  },
  marseille: {
    image:
      'https://images.unsplash.com/photo-1608037580875-df901b196878?auto=format&fit=crop&w=1800&q=88',
    imagePosition: '50% 50%',
  },
};

function getCityVisual(property: OwnerProperty): CityVisual {
  const normalizedCity = property.city.trim().toLocaleLowerCase('fr');

  return (
    CITY_VISUALS[normalizedCity] ?? {
      image: property.coverImage,
      imagePosition: '50% 50%',
    }
  );
}

type EquipmentCard = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  description: string;
  steps: string[];
  image: string;
};

type NearbyFilter = string;

type GuideMessage = {
  id: string;
  content: string;
  senderRole: 'guest' | 'owner';
  senderName: string;
  createdAt: Date | null;
};

const checkoutTasks = [
  'Fermer toutes les fenêtres',
  'Éteindre les lumières',
  'Vider le réfrigérateur',
  'Sortir les poubelles',
  'Remettre les clés dans la boîte',
];

const guideCopy = {
  fr: {
    privateGuide: 'Livret privé', yourGuide: 'Votre guide privé', yourHost: 'Votre hôte', welcomes: 'vous accueille', stayStarts: 'Votre séjour commence ici', yourHome: 'Votre logement', wifi: 'Wi-Fi de l’appartement', connect: 'Connectez-vous en un geste', journey: 'Votre parcours', arrivalDeparture: 'Arrivée & départ', allInstructions: 'Toutes les instructions', prepareDeparture: 'Préparer mon départ', nearbySelection: 'La sélection de', bestNeighbourhood: 'Le meilleur du quartier', nearbyDescription: 'Des adresses choisies avec soin, toutes accessibles à pied.', directions: 'Itinéraire', booklet: 'Le livret', nearby: 'À proximité', privateMessages: 'Messagerie privée', backToBooklet: 'Retour au livret', firstMessage: 'Envoyez un premier message', writeMessage: 'Écrivez votre message…', exchangesPrivate: 'Vos échanges restent privés entre vous et votre hôte.', arrival: 'Arrivée', departure: 'Départ', yourStay: 'Votre séjour', chooseLanguage: 'Choisir la langue', languageFrench: 'Français', languageEnglish: 'English',
  },
  en: {
    privateGuide: 'Private guide', yourGuide: 'Your private guide', yourHost: 'Your host', welcomes: 'welcomes you', stayStarts: 'Your stay starts here', yourHome: 'Your home', wifi: 'Apartment Wi-Fi', connect: 'Connect in one tap', journey: 'Your stay', arrivalDeparture: 'Arrival & departure', allInstructions: 'All instructions', prepareDeparture: 'Prepare my departure', nearbySelection: 'Selected by', bestNeighbourhood: 'The best in the neighbourhood', nearbyDescription: 'Carefully selected places, all within walking distance.', directions: 'Directions', booklet: 'Guide', nearby: 'Nearby', privateMessages: 'Private messages', backToBooklet: 'Back to guide', firstMessage: 'Send your first message', writeMessage: 'Write your message…', exchangesPrivate: 'Your conversations remain private between you and your host.', arrival: 'Arrival', departure: 'Departure', yourStay: 'Your stay', chooseLanguage: 'Choose language', languageFrench: 'French', languageEnglish: 'English',
  },
} as const;

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
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<
    EquipmentCard | null
  >(null);
  const [isClosingEquipment, setIsClosingEquipment] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [guestId, setGuestId] = useState('');
  const [chatMessages, setChatMessages] = useState<GuideMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestNameConfirmed, setGuestNameConfirmed] = useState(false);
  const [chatError, setChatError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatConnecting, setChatConnecting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingError, setRatingError] = useState('');
  const [isSendingRating, setIsSendingRating] = useState(false);
  const [isLoadingRating, setIsLoadingRating] = useState(false);
  const equipmentGuideRef = useRef<HTMLDivElement>(null);
  const nearbyPlacesRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroBackdropRef = useRef<HTMLDivElement>(null);
  const heroFocusRef = useRef<HTMLDivElement>(null);
  const heroFooterRef = useRef<HTMLDivElement>(null);
  const equipmentGuideOpen = selectedEquipment !== null;
  const blockingOverlayOpen = equipmentGuideOpen || chatOpen || instructionsOpen;
  const departureComplete = checkedTasks.length === checkoutTasks.length;
  const departureProgress = Math.round((checkedTasks.length / checkoutTasks.length) * 100);
  const copy = guideCopy[language];
  const propertyNearbyPlaces = (property.nearbyPlaces ?? []).map((place, index) => ({
    ...place,
    filter: place.category || 'Autre',
    distance: place.address || 'Adresse recommandée',
    rating: place.note || '★',
    image: property.nearbyPlaces?.[index]?.imageUrl || property.gallery?.[index]?.url || getCityVisual(property).image,
  }));
  const guideNearbyFilters = ['Tout', ...Array.from(new Set(propertyNearbyPlaces.map((place) => place.filter)))];
  const visibleNearbyPlaces =
    nearbyFilter === 'Tout'
      ? propertyNearbyPlaces
      : propertyNearbyPlaces.filter((place) => place.filter === nearbyFilter);
  const cityVisual = getCityVisual(property);
  const heroImage = property.coverImage.trim() || property.gallery?.find((photo) => photo.url.trim())?.url.trim() || cityVisual.image;
  const hostAvatar = property.hostAvatarUrl?.trim() || '';
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
  const hostInitial = hostFirstName.trim().slice(0, 1).toLocaleUpperCase('fr-FR') || 'H';
  const guideFaqs = property.faqItems?.length
    ? property.faqItems.map((question) => ({ question, answer: `Pour cette information, contactez ${hostFirstName || 'votre hôte'} si besoin.` }))
    : [];
  const compactPhone = property.hostPhone.replace(/\s/g, '');
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
      const savedLanguage = window.localStorage.getItem(`monlivret:language:${params.secureToken}`);
      const preferredLanguage = savedLanguage === 'en' || savedLanguage === 'fr'
        ? savedLanguage
        : data.language === 'en' ? 'en' : 'fr';
      setLanguage(preferredLanguage);
      document.documentElement.lang = preferredLanguage;
      setRatingError('');
      setOwnerId(String(data.ownerId ?? ''));
      setProperty({
        ...DEFAULT_OWNER_PROPERTIES[0],
        id: String(data.propertyId ?? guide.id),
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
        nearbyPlaces: Array.isArray(data.nearbyPlaces) ? data.nearbyPlaces.map((place) => ({ name: String(place?.name ?? ''), category: String(place?.category ?? ''), address: String(place?.address ?? ''), postalCode: String(place?.postalCode ?? ''), city: String(place?.city ?? ''), note: String(place?.note ?? ''), imageUrl: String(place?.imageUrl ?? '') })) : [],
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
    if (!property.id || !ownerId) return;

    let active = true;
    const loadExistingRating = async () => {
      setIsLoadingRating(true);
      try {
        await firebaseAuthReady;
        const currentUser = firebaseAuth.currentUser ?? (await signInAnonymously(firebaseAuth)).user;
        const ratingDocument = await getDoc(doc(firestore, 'guide_reviews', `${property.id}_${currentUser.uid}`));
        const savedScore = Number(ratingDocument.data()?.score ?? 0);
        if (active) setSelectedRating(Number.isInteger(savedScore) && savedScore >= 1 && savedScore <= 5 ? savedScore : 0);
      } catch {
        // The rating remains available even if this first read is temporarily unavailable.
        if (active) setSelectedRating(0);
      } finally {
        if (active) setIsLoadingRating(false);
      }
    };

    void loadExistingRating();
    return () => { active = false; };
  }, [ownerId, property.id]);

  const selectLanguage = (nextLanguage: 'fr' | 'en') => {
    setLanguage(nextLanguage);
    setLanguageMenuOpen(false);
    window.localStorage.setItem(`monlivret:language:${params.secureToken}`, nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  useEffect(() => {
    if (!chatOpen || !property.id) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const startConversation = async () => {
      try {
        await firebaseAuthReady;
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
                senderName: String(message.data().senderName ?? (message.data().senderRole === 'owner' ? 'Propriétaire' : 'Voyageur')),
                createdAt: message.data().createdAt?.toDate?.() ?? null,
                propertyId: String(message.data().propertyId ?? ''),
              }))
              .filter((message) => message.propertyId === property.id)
              .sort((first, second) => (first.createdAt?.getTime() ?? 0) - (second.createdAt?.getTime() ?? 0)));
            setChatConnecting(false);
          },
          (snapshotError) => {
            if (!active) return;
            setChatConnecting(false);
            setChatError(snapshotError.code === 'permission-denied'
              ? 'La messagerie n’est pas autorisée par Firebase. Vérifiez les règles Firestore déployées.'
              : 'Impossible de charger la conversation pour le moment.');
          },
        );
      } catch (authenticationError) {
        if (!active) return;
        setChatConnecting(false);
        const code = authenticationError && typeof authenticationError === 'object' && 'code' in authenticationError
          ? String(authenticationError.code)
          : '';
        setChatError(code === 'auth/operation-not-allowed'
          ? 'La messagerie doit être activée dans Firebase Authentication (connexion anonyme).'
          : 'La messagerie n’est pas disponible pour le moment.');
      }
    };

    void startConversation();
    return () => { active = false; unsubscribe?.(); };
  }, [chatOpen, property.id]);

  useEffect(() => {
    if (!ownerId || !params.secureToken) return;
    const isQrVisit = new URLSearchParams(window.location.search).get('source') === 'qr';
    const eventTypes = isQrVisit ? ['view', 'qr_scan'] : ['view'];
    void Promise.all(eventTypes.map((eventType) => addDoc(collection(firestore, 'guide_events'), {
      propertyId: property.id,
      ownerId,
      eventType,
      source: isQrVisit ? 'qr' : 'direct',
      occurredAt: serverTimestamp(),
    }))).catch(() => undefined);
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
    if (!blockingOverlayOpen) return;

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
  }, [blockingOverlayOpen]);

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
    if (!guestNameConfirmed || !guestName.trim()) {
      setChatError('Indiquez votre prénom et votre nom avant d’envoyer un message.');
      return;
    }
    if (content.length > 1000) {
      setChatError('Votre message ne peut pas dépasser 1 000 caractères.');
      return;
    }
    if (containsBlockedMessageTerm(content)) {
      setChatError('Ce message contient un terme interdit. Reformulez-le avant de l’envoyer.');
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
        guestName: guestName.trim(),
        senderRole: 'guest',
        senderName: guestName.trim(),
        content,
        moderationStatus: 'approved',
        createdAt: serverTimestamp(),
      });
      window.localStorage.setItem('monlivret:guest-name', guestName.trim());
      setChatDraft('');
    } catch {
      setChatError('Votre message n’a pas pu être envoyé. Réessayez dans un instant.');
    } finally {
      setSendingMessage(false);
    }
  };

  const submitRating = async (score: number) => {
    if (!ownerId || !property.id || isSendingRating || isLoadingRating || selectedRating) return;
    setIsSendingRating(true);
    setRatingError('');
    try {
      await firebaseAuthReady;
      const currentUser = firebaseAuth.currentUser ?? (await signInAnonymously(firebaseAuth)).user;
      await setDoc(doc(firestore, 'guide_reviews', `${property.id}_${currentUser.uid}`), {
        propertyId: property.id,
        propertyName: property.name,
        ownerId,
        guestId: currentUser.uid,
        score,
        guideToken: String(params.secureToken),
        createdAt: serverTimestamp(),
      });
      setSelectedRating(score);
    } catch {
      setRatingError('Votre avis n’a pas pu être enregistré. Réessayez dans un instant.');
    } finally {
      setIsSendingRating(false);
    }
  };

  const openChat = () => {
    setChatError('');
    setChatMessages([]);
    setGuestId('');
    const savedGuestName = window.localStorage.getItem('monlivret:guest-name') ?? '';
    setGuestName(savedGuestName);
    setGuestNameConfirmed(Boolean(savedGuestName));
    setChatConnecting(true);
    setChatOpen(true);
  };

  const confirmGuestName = () => {
    const normalizedName = guestName.trim().replace(/\s+/g, ' ');
    if (normalizedName.split(' ').length < 2) {
      setChatError('Saisissez votre prénom et votre nom pour continuer.');
      return;
    }
    setGuestName(normalizedName);
    window.localStorage.setItem('monlivret:guest-name', normalizedName);
    setChatError('');
    setGuestNameConfirmed(true);
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
                    <Image
                      src="/icon.png"
                      alt="Mon Livret"
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-xl shadow-[0_7px_18px_rgba(8,24,34,.2)]"
                    />
                    <span className="min-w-0">
                      <span className="block max-w-[205px] truncate font-serif text-[15px] font-semibold leading-tight">
                        {headerScrolled ? property.name : 'Mon Livret'}
                      </span>
                      <span
                        className={`mt-0.5 block text-[8px] uppercase tracking-[0.14em] ${
                          headerScrolled ? 'text-[#6f7c84]' : 'text-white/58'
                        }`}
                      >
                        {headerScrolled ? `${property.city} · ${copy.privateGuide}` : copy.yourGuide}
                      </span>
                    </span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      aria-label={copy.chooseLanguage}
                      aria-expanded={languageMenuOpen}
                      onClick={() => setLanguageMenuOpen((open) => !open)}
                      className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all duration-300 ${
                        headerScrolled
                          ? 'border-[#142c3f]/8 bg-[#f3eee8] text-[#172b35]'
                          : 'border-white/12 bg-white/10 text-white hover:bg-white/16'
                      }`}
                    >
                      <span aria-hidden="true">{language === 'en' ? '🇬🇧' : '🇫🇷'}</span>
                      {language === 'en' ? 'EN' : 'FR'}
                      <ChevronDown size={13} className={headerScrolled ? 'text-[#6e777b]' : 'text-white/60'} />
                    </button>
                    {languageMenuOpen && (
                      <div className="absolute right-0 top-11 z-[130] w-40 overflow-hidden rounded-xl border border-[#142c3f]/10 bg-white p-1.5 text-[#142c3f] shadow-[0_14px_34px_rgba(20,44,63,.18)]">
                        <button type="button" onClick={() => selectLanguage('fr')} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${language === 'fr' ? 'bg-[#f3eee8] text-[#d9694d]' : 'hover:bg-[#f8f6f2]'}`}><span>🇫🇷 {copy.languageFrench}</span>{language === 'fr' && <Check size={14} />}</button>
                        <button type="button" onClick={() => selectLanguage('en')} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${language === 'en' ? 'bg-[#f3eee8] text-[#d9694d]' : 'hover:bg-[#f8f6f2]'}`}><span>🇬🇧 {copy.languageEnglish}</span>{language === 'en' && <Check size={14} />}</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                ref={heroFocusRef}
                className="guest-hero-copy mt-auto flex flex-col items-start pb-5 pt-24 text-left will-change-[transform,opacity]"
              >
                <div className="guest-hero-avatar flex items-center gap-3 rounded-full border border-white/15 bg-black/18 py-1.5 pl-1.5 pr-4 backdrop-blur-lg">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white/75 bg-[#d8c8bc] shadow-lg">
                    {hostAvatar ? <Image src={hostAvatar} alt={`Portrait de ${property.hostName}`} fill unoptimized sizes="44px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center bg-[#d9694d] font-serif text-lg italic text-white" aria-label={`Initiale de ${property.hostName}`}>{hostInitial}</span>}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#ffd0b8]">
                      {copy.yourHost}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-white">
                      {hostFirstName} {copy.welcomes}
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.22em] text-white/66">
                  {copy.stayStarts}
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
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/48">{copy.yourHome}</p>
                    <p className="mt-1 break-words font-serif text-[17px] font-semibold leading-tight text-white">{property.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-medium uppercase tracking-[0.1em] text-white/65">
                      <span>{property.type || 'Logement'}</span>
                      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/45" />
                      <span>{property.capacity} voyageur{property.capacity > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div
                    title="Lien privé et sécurisé"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/10 text-white/78"
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
                    {copy.wifi}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#142c3f]">
                    {copy.connect}
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
                {copy.journey}
              </p>
              <h2 className="mt-1 whitespace-nowrap text-[clamp(1.75rem,8vw,2rem)] font-semibold tracking-[-0.035em]">
                {copy.arrivalDeparture}
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
                    onClick={() => setInstructionsOpen(true)}
                    className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-[#f3eee8] px-2 py-3 text-[13px] font-semibold"
                  >
                    {copy.allInstructions}
                    <ArrowRight size={15} className="shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={startDeparture}
                    className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-[#102a3d] px-2 py-3 text-[13px] font-semibold text-white"
                  >
                    {copy.prepareDeparture}
                    <Check size={15} className="shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {property.houseRules?.some((rule) => rule.trim()) && (
            <section className="px-5 py-7">
              <div className="overflow-hidden rounded-[2rem] border border-[#ead9cf] bg-[#fffaf7] shadow-[0_14px_40px_rgba(103,65,44,0.07)]">
                <div className="flex items-start gap-4 border-b border-[#ead9cf] bg-[#f7e8df] p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-[#d9694d] text-white shadow-[0_8px_18px_rgba(217,105,77,0.24)]">
                    <Home size={21} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b85a40]">Pour bien vivre ensemble</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#142c3f]">Règles de la maison</h2>
                    <p className="mt-1 text-sm leading-5 text-[#69777d]">Quelques repères simples pour profiter pleinement du logement.</p>
                  </div>
                </div>
                <div className="p-3">
                  {property.houseRules.filter((rule) => rule.trim()).map((rule, index) => (
                    <div key={`${rule}-${index}`} className="flex items-center gap-3 rounded-[1.15rem] px-3 py-3.5 transition hover:bg-white">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4e4dc] text-xs font-bold text-[#c86145]">{String(index + 1).padStart(2, '0')}</span>
                      <p className="text-sm font-medium leading-5 text-[#31444b]">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

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
            <div className="relative overflow-hidden rounded-[2rem] border border-[#142c3f]/8 bg-white shadow-[0_20px_50px_rgba(20,44,63,0.09)]">
              <div className="absolute inset-x-0 top-0 h-28 overflow-hidden bg-[#173b50]"><Image src={heroImage} alt="" fill unoptimized sizes="(max-width: 560px) 100vw, 560px" className="object-cover opacity-65" /></div>
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-[#102a3d]/88 via-[#173b50]/75 to-[#367566]/80" />
              <div className="absolute -right-10 top-2 h-28 w-28 rounded-full border border-white/10" />
              <div className="relative p-5 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                    {copy.yourHost}
                  </p>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                    <BadgeCheck size={13} className="text-[#9ed6c7]" />
                    Vérifié
                  </span>
                </div>

                <div className="mt-7">
                  <div className="relative h-[72px] w-[72px] overflow-hidden rounded-[1.5rem] border-[3px] border-white bg-[#eaded8] shadow-[0_10px_22px_rgba(20,44,63,0.22)]">
                    {hostAvatar ? <Image src={hostAvatar} alt={`Portrait de ${property.hostName}`} fill unoptimized sizes="82px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center bg-[#d9694d] font-serif text-3xl italic text-white" aria-label={`Initiale de ${property.hostName}`}>{hostInitial}</span>}
                  </div>
                  <div className="mt-4 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8f90]">{copy.yourHost}</p>
                    <h2 className="mt-1 truncate text-xl font-semibold tracking-[-0.02em] text-[#142c3f]">{property.hostName}</h2>
                    <p className="mt-1 truncate text-xs text-[#718087]">À votre écoute à {property.city}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.35rem] bg-[#f3f7f5] p-4">
                  <p className="flex items-center gap-2 text-[11px] font-bold text-[#367566]"><span className="h-2 w-2 rounded-full bg-[#48a988]" /> Disponible maintenant</p>
                  <p className="mt-2 text-sm leading-6 text-[#53656d]">Une question pendant votre séjour ? Envoyez un message à {hostFirstName || 'votre hôte'} pour recevoir de l’aide directement ici.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${compactPhone}`}
                    className="flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-[#dce3e1] bg-white px-3 py-3.5 text-sm font-semibold text-[#142c3f] shadow-sm transition active:scale-[.98]"
                  >
                    <Phone size={17} />
                    <span className="truncate">Appeler</span>
                  </a>
                  <button
                    type="button"
                    onClick={openChat}
                    className="flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#367566] px-3 py-3.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(54,117,102,0.24)] transition active:scale-[.98]"
                  >
                    <MessageCircle size={17} />
                    <span className="truncate">Écrire un message</span>
                  </button>
                </div>
              </div>
              <div className="border-t border-[#142c3f]/8 bg-[#fbfaf8] px-5 py-3.5 text-center text-xs text-[#7b858b]">
                En cas d’urgence médicale ou de sécurité, appelez le <strong className="font-semibold text-[#30434b]">112</strong>.
              </div>
            </div>
          </section>

          {departureMode && (
            <section id="departure" className="scroll-mt-24 px-5 py-7">
              <div className="relative overflow-hidden rounded-[2rem] border border-[#d7c8bf] bg-[#f7f1ed] p-5 shadow-[0_20px_44px_rgba(96,65,47,0.1)]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#e7754d]/12 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#367566]/10 blur-2xl" />
                <div className="relative flex items-start justify-between gap-4">
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e7dfd8] bg-white text-[#6f7c84] shadow-sm transition active:scale-95"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="relative mt-5 rounded-[1.35rem] border border-white/80 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{checkedTasks.length} sur {checkoutTasks.length} terminées</span>
                    <span className="text-[#367566]">
                      {departureProgress} %
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8e5e1]">
                    <div
                      className="h-full rounded-full bg-[#367566] transition-all duration-500"
                      style={{
                        width: `${departureProgress}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="relative mt-3 overflow-hidden rounded-[1.35rem] border border-[#142c3f]/8 bg-white shadow-sm">
                  {checkoutTasks.map((task, index) => {
                    const checked = checkedTasks.includes(index);
                    return (
                      <button
                        key={task}
                        type="button"
                        onClick={() => toggleTask(index)}
                        className={`group flex w-full items-center gap-4 border-b border-[#142c3f]/8 px-4 py-4 text-left transition duration-300 last:border-b-0 ${checked ? 'bg-[#eff7f4]' : 'hover:bg-[#faf8f5] active:scale-[.99]'}`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                            checked
                              ? 'scale-105 border-[#367566] bg-[#367566] text-white shadow-[0_5px_13px_rgba(54,117,102,0.26)]'
                              : 'border-[#d7c8bf] bg-[#faf7f4] text-[#a75b47]'
                          }`}
                        >
                          {checked ? <Check size={16} /> : index + 1}
                        </span>
                        <span className="flex-1">
                          <span
                            className={`block text-sm font-semibold transition ${
                              checked ? 'text-[#5f8579] line-through' : ''
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

                {departureComplete && (
                  <div className="departure-complete relative mt-4 overflow-hidden rounded-[1.35rem] bg-[#367566] p-5 text-white shadow-[0_16px_28px_rgba(54,117,102,0.25)]">
                    <div className="departure-confetti" aria-hidden="true">
                      {Array.from({ length: 18 }, (_, index) => <span key={index} style={{ '--confetti-index': index } as CSSProperties} />)}
                    </div>
                    <div className="relative">
                      <p className="text-base font-semibold">Tout est prêt, merci !</p>
                      <p className="mt-1 text-sm leading-5 text-white/78">Votre départ est préparé. Nous vous souhaitons un excellent retour.</p>
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
              <button
                type="button"
                onClick={openChat}
                className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f2ef] text-[#367566]"
                aria-label={`Poser une question à ${hostFirstName}`}
              >
                <MessageCircle size={18} />
              </button>
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
            <div className="mb-6 px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase leading-4 tracking-[0.14em] text-[#d9694d] min-[390px]:text-[10px] min-[390px]:tracking-[0.18em]">{copy.nearbySelection} {hostFirstName}</p>
                  <h2 className="mt-2 max-w-[19rem] font-serif text-[clamp(2rem,9.2vw,2.7rem)] font-semibold leading-[0.96] tracking-[-0.045em]">
                    {copy.bestNeighbourhood}
                  </h2>
                </div>
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#142c3f]/9 bg-[#f3eee8] text-xs font-semibold text-[#64716b]">
                  {visibleNearbyPlaces.length}
                </span>
              </div>
              <p className="mt-4 max-w-md text-[15px] leading-6 text-[#6f7c84]">
                {copy.nearbyDescription}
              </p>
              <div className="guest-scrollbar -mr-5 mt-5 flex gap-2 overflow-x-auto pr-5">
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
                  className="group relative h-[clamp(340px,84vw,410px)] w-[calc(100vw-3rem)] max-w-[360px] shrink-0 snap-center animate-[fadeIn_280ms_ease-out] overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#18384e] shadow-[0_20px_50px_rgba(2,13,20,.28)]"
                >
                  <Image
                    src={place.image}
                    alt={place.name}
                    fill
                    unoptimized
                    sizes="(max-width: 560px) calc(100vw - 48px), 360px"
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
                        {copy.directions}
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
                    aria-pressed={selectedRating === star}
                    disabled={Boolean(selectedRating) || isSendingRating}
                    onClick={() => void submitRating(star)}
                    className="rounded-full p-1 text-[#d9694d] transition hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
                  >
                    <Star size={27} fill={selectedRating >= star ? '#d9694d' : 'none'} />
                  </button>
                ))}
              </div>
              {isSendingRating ? <p className="mt-3 text-sm font-medium text-[#6f7c84]">Enregistrement de votre note…</p> : null}
              {selectedRating ? <p className="mt-3 text-sm font-semibold text-[#367566]">Merci, votre note de {selectedRating} étoile{selectedRating > 1 ? 's' : ''} a bien été enregistrée.</p> : null}
              {ratingError ? <p className="mt-3 text-sm font-medium text-[#b14e39]">{ratingError}</p> : null}
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
                    onClick={openChat}
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
                <button
                  type="button"
                  onClick={openChat}
                  className="rounded-full bg-[#367566] px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Écrire
                </button>
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

        {instructionsOpen && createPortal(
          <div role="dialog" aria-modal="true" aria-label={copy.allInstructions} className="fixed inset-0 z-[120] mx-auto flex max-w-[560px] flex-col bg-[#fbfaf8]">
            <div className="flex items-center justify-between border-b border-[#142c3f]/8 bg-white px-5 py-3 shadow-sm">
              <button type="button" onClick={() => setInstructionsOpen(false)} aria-label="Fermer les instructions" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3eee8] text-[#142c3f] transition hover:bg-[#e9e3dc]"><ArrowLeft size={19} /></button>
              <div className="min-w-0 text-center"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d9694d]">{copy.yourStay}</p><h2 className="mt-0.5 text-sm font-semibold text-[#142c3f]">{copy.allInstructions}</h2></div>
              <button type="button" onClick={() => setInstructionsOpen(false)} aria-label="Fermer" className="flex h-10 w-10 items-center justify-center rounded-full text-[#718087]"><X size={19} /></button>
            </div>
            <div className="guest-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
              <div className="rounded-[1.7rem] bg-[#102a3d] p-5 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ef9a78]">Arrivée</p>
                <p className="mt-2 text-2xl font-semibold">À partir de {property.checkIn || '15:00'}</p>
                <p className="mt-2 text-sm leading-6 text-white/65">Tout ce qu’il faut savoir pour accéder sereinement au logement.</p>
              </div>
              <div className="relative mt-5 space-y-3 before:absolute before:bottom-8 before:left-[1.45rem] before:top-8 before:w-px before:bg-[#d9694d]/20">
                {[
                  ['01', 'Instructions d’arrivée', property.arrivalInstructions || 'Les instructions seront communiquées par votre hôte.'],
                  ['02', 'Accès au logement', property.accessCode || 'Accès à confirmer avec votre hôte.'],
                  ['03', 'Informations pratiques', property.parkingInstructions || 'Retrouvez le Wi-Fi, les équipements et les informations utiles dans ce livret.'],
                ].map(([number, title, description]) => (
                  <article key={number} className="relative rounded-[1.4rem] border border-[#142c3f]/8 bg-white p-4 shadow-[0_8px_24px_rgba(20,44,63,0.04)]">
                    <div className="flex gap-3"><span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4e5df] text-xs font-bold text-[#d9694d]">{number}</span><div className="min-w-0"><h3 className="text-sm font-semibold text-[#142c3f]">{title}</h3><p className="mt-1 text-sm leading-6 text-[#63737b]">{description}</p></div></div>
                  </article>
                ))}
              </div>
              <div className="mt-6 rounded-[1.7rem] border border-[#cfe1da] bg-[#eef6f2] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#367566]">Départ</p>
                <p className="mt-2 text-xl font-semibold text-[#173b50]">Avant {property.checkOut || '11:00'}</p>
                <p className="mt-2 text-sm leading-6 text-[#58756e]">{property.departureInstructions || 'Préparez votre départ avec la checklist pour ne rien oublier.'}</p>
                <button type="button" onClick={() => { setInstructionsOpen(false); startDeparture(); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#367566] px-4 py-3 text-sm font-semibold text-white"><Check size={16} /> Ouvrir la checklist de départ</button>
              </div>
            </div>
          </div>,
          document.body,
        )}

        {chatOpen && createPortal(
          <div role="dialog" aria-modal="true" aria-label={`Messagerie avec ${hostFirstName}`} className="fixed inset-0 z-[120] mx-auto flex max-w-[560px] flex-col bg-[#fbfaf8]">
            <div className="relative grid grid-cols-[40px_minmax(0,1fr)_40px] items-center overflow-hidden bg-[#102a3d] px-5 py-4 text-white shadow-[0_8px_24px_rgba(16,42,61,0.2)]">
              <div className="pointer-events-none absolute -right-7 -top-10 h-28 w-28 rounded-full border border-white/10" />
              <button type="button" onClick={() => setChatOpen(false)} aria-label={copy.backToBooklet} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"><ArrowLeft size={19} /></button>
              <div className="min-w-0 px-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#ef9a78]">{copy.privateMessages}</p>
                <p className="mt-0.5 truncate text-sm font-semibold">{property.hostName || 'Votre propriétaire'}</p>
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">{property.name}</p>
              </div>
              <span aria-hidden="true" className="h-10 w-10" />
            </div>
            <div className="guest-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-5">
              {chatConnecting && <p className="text-center text-sm text-[#718087]">Connexion sécurisée à la messagerie…</p>}
              {!guestNameConfirmed && <div className="mx-auto mt-5 max-w-sm rounded-[1.5rem] border border-[#dbe6e1] bg-white p-5 text-center shadow-[0_10px_24px_rgba(20,44,63,0.04)]"><p className="text-sm font-semibold text-[#173b50]">Avant de commencer</p><p className="mt-1 text-xs leading-5 text-[#718087]">Indiquez votre prénom et nom : votre hôte saura immédiatement qui lui écrit.</p><input value={guestName} onChange={(event) => { setGuestName(event.target.value); setGuestNameConfirmed(false); setChatError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') confirmGuestName(); }} maxLength={80} autoComplete="name" placeholder="Ex. Camille Martin" className="mt-4 h-11 w-full rounded-xl border border-[#d8e0dc] bg-[#f7faf8] px-3 text-base text-[#173b50] outline-none placeholder:text-[#98a0a2] focus:border-[#367566] sm:text-sm" /><button type="button" onClick={confirmGuestName} disabled={!guestName.trim()} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#367566] px-4 text-sm font-semibold text-white transition hover:bg-[#2f695b] disabled:cursor-not-allowed disabled:opacity-40"><Check size={16} /> Confirmer mon identité</button></div>}
              {!chatMessages.length && <div className="mx-auto mt-8 max-w-sm rounded-[1.75rem] border border-[#dbe6e1] bg-[#f1f7f4] p-6 text-center shadow-[0_12px_28px_rgba(20,44,63,0.05)]"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#367566] text-white shadow-[0_8px_18px_rgba(54,117,102,0.22)]"><MessageCircle size={21} /></span><p className="mt-4 text-base font-semibold text-[#173b50]">{copy.firstMessage}</p><p className="mt-2 text-sm leading-6 text-[#62767a]">{language === 'en' ? `Say hello to ${hostFirstName}. Your host will receive your message directly in their private space.` : `Dites bonjour à ${hostFirstName}. Votre hôte recevra votre message directement dans son espace privé.`}</p><div className="mt-4 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => setChatDraft(language === 'en' ? 'Hello, I have a question about my stay.' : 'Bonjour, j’ai une question concernant mon séjour.')} className="rounded-full border border-[#d0e1da] bg-white px-3 py-2 text-xs font-semibold text-[#367566]">{language === 'en' ? 'I have a question' : 'J’ai une question'}</button><button type="button" onClick={() => setChatDraft(language === 'en' ? 'Hello, I have just arrived at the property.' : 'Bonjour, je viens d’arriver au logement.')} className="rounded-full border border-[#d0e1da] bg-white px-3 py-2 text-xs font-semibold text-[#367566]">{language === 'en' ? 'I just arrived' : 'Je viens d’arriver'}</button></div></div>}
              {chatMessages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${message.senderRole === 'guest' ? 'ml-auto bg-[#102a3d] text-white' : 'bg-white text-[#31434c] shadow-sm'}`}><p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.12em] ${message.senderRole === 'guest' ? 'text-white/60' : 'text-[#718087]'}`}>{message.senderRole === 'guest' ? 'Vous' : message.senderName || hostFirstName} · {formatMessageDateTime(message.createdAt)}</p><p>{message.content}</p></div>)}
            </div>
            <div className="border-t border-[#142c3f]/8 bg-white p-4"><div className="flex gap-2 rounded-[1.35rem] border border-[#d8e0dc] bg-[#f7faf8] p-2 shadow-[0_8px_20px_rgba(20,44,63,0.04)]"><textarea value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} maxLength={1000} rows={2} placeholder={copy.writeMessage} className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1 text-base outline-none placeholder:text-[#98a0a2] sm:text-sm" /><button type="button" onClick={sendMessage} disabled={chatConnecting || sendingMessage || !chatDraft.trim() || !guestId} aria-label={copy.writeMessage} className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl bg-[#d9694d] text-white shadow-[0_7px_15px_rgba(217,105,77,0.25)] transition hover:bg-[#c9532d] disabled:opacity-40"><Send size={17} /></button></div><p className="mt-2 text-center text-[10px] text-[#8a9795]">{copy.exchangesPrivate}</p>{chatError && <p role="alert" className="mt-2 text-xs text-[#b8453c]">{chatError}</p>}</div>
          </div>,
          document.body,
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
              {copy.booklet}
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
              {copy.nearby}
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
