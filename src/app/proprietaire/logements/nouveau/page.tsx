'use client';

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import {
  type OwnerProperty,
} from '@/lib/owner-properties';
import { firebaseAuth, firebaseAuthReady, firebaseStorage, firestore } from '@/lib/firebase/client';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  Clock3,
  Home,
  ImageIcon,
  KeyRound,
  ListChecks,
  MapPin,
  Palette,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
  UserRound,
  Users,
  Wifi,
} from 'lucide-react';

const steps = [
  {
    id: 1,
    label: 'Le logement',
    description: 'Identité et adresse',
    icon: Building2,
  },
  {
    id: 2,
    label: 'Arrivée & accès',
    description: 'Horaires, accès et Wi-Fi',
    icon: Clock3,
  },
  {
    id: 3,
    label: 'Équipements',
    description: 'Tout ce qui est disponible',
    icon: Wifi,
  },
  {
    id: 4,
    label: 'Règles & FAQ',
    description: 'Consignes et réponses utiles',
    icon: ListChecks,
  },
  {
    id: 5,
    label: 'Aux alentours',
    description: 'Restaurants et bonnes adresses',
    icon: Utensils,
  },
  {
    id: 6,
    label: 'Contact',
    description: 'Hôte et urgence',
    icon: UserRound,
  },
  {
    id: 7,
    label: 'Apparence',
    description: 'Photo, message et couleur',
    icon: Palette,
  },
  {
    id: 8,
    label: 'Publication',
    description: 'Vérification et mise en ligne',
    icon: Sparkles,
  },
];

const coverPresets = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
];

type PropertyDraft = Omit<
  OwnerProperty,
  'id' | 'views' | 'completion' | 'updatedAt'
>;

type AddressSuggestion = {
  label: string;
  address: string;
  city: string;
  postalCode: string;
};

const initialProperty: PropertyDraft = {
  name: '',
  type: 'Appartement',
  address: '',
  city: '',
  postalCode: '',
  capacity: 2,
  bedrooms: 1,
  checkIn: '15:00',
  checkOut: '11:00',
  wifiName: '',
  wifiPassword: '',
  description: '',
  hostName: '',
  hostPhone: '',
  hostEmail: '',
  coverImage: coverPresets[0],
  status: 'draft',
  arrivalInstructions: '',
  accessCode: '',
  parkingInstructions: '',
  departureInstructions: '',
  amenities: ['Wi-Fi', 'Cuisine équipée', 'Linge de maison'],
  houseRules: ['Logement non-fumeur', 'Pas de fête ni soirée'],
  faqItems: ['Où jeter les poubelles ? — Dans le local au rez-de-chaussée.'],
  nearbyPlaces: [
    {
      name: '',
      category: 'Restaurant',
      address: '',
      note: '',
    },
  ],
  emergencyContact: '',
  welcomeTitle: 'Bienvenue chez vous',
  accentColor: '#d85b24',
  gallery: [],
  welcomeSubtitle: 'Votre guide privé pour un séjour serein',
  hostMessage: '',
  theme: 'terra',
  language: 'fr',
  showWifi: true,
  showMap: true,
  showFaq: true,
  showGallery: true,
};

const fieldClass =
  'h-12 rounded-xl border-[#ded8d1] bg-white px-4 shadow-none focus-visible:border-[#d85b24] focus-visible:ring-[#d85b24]/15';

export default function NewPropertyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [property, setProperty] = useState<PropertyDraft>(initialProperty);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [uploading, setUploading] = useState<'cover' | 'gallery' | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const progress = (currentStep / steps.length) * 100;
  const currentStepData = steps[currentStep - 1];

  const completedFields = useMemo(() => {
    const importantFields = [
      property.name,
      property.address,
      property.city,
      property.postalCode,
      property.description,
      property.hostName,
      property.hostPhone,
      property.coverImage,
      property.arrivalInstructions,
      property.amenities?.length ? 'amenities' : '',
      property.houseRules?.length ? 'rules' : '',
      property.nearbyPlaces?.some((place) => place.name) ? 'places' : '',
    ];

    return importantFields.filter(Boolean).length;
  }, [property]);

  const updateProperty = <Key extends keyof PropertyDraft>(
    key: Key,
    value: PropertyDraft[Key]
  ) => {
    setProperty((current) => ({ ...current, [key]: value }));
    setError('');
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const togglePublication = () => {
    setProperty((current) => ({
      ...current,
      status: current.status === 'published' ? 'draft' : 'published',
    }));
    setError('');
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('file-type');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('file-size');
    }

    await firebaseAuthReady;
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('not-authenticated');

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const imageRef = ref(
      firebaseStorage,
      `properties/${user.uid}/drafts/${crypto.randomUUID()}-${safeFileName}`,
    );
    await uploadBytes(imageRef, file, { contentType: file.type });
    return getDownloadURL(imageRef);
  };

  const uploadCoverImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!file) return;

    setUploading('cover');
    setError('');
    try {
      updateProperty('coverImage', await uploadImage(file));
    } catch (uploadError) {
      const code = uploadError instanceof Error ? uploadError.message : '';
      setError(code === 'file-type'
        ? 'Choisissez un fichier image (JPG, PNG, WebP…).'
        : code === 'file-size'
          ? 'L’image est trop volumineuse. La taille maximale est de 10 Mo.'
          : 'Impossible d’envoyer l’image. Vérifiez votre connexion puis réessayez.');
    } finally {
      setUploading(null);
    }
  };

  const uploadGalleryImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    setUploading('gallery');
    setError('');
    try {
      const photos = await Promise.all(files.map(async (file) => ({
        url: await uploadImage(file),
        caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      })));
      updateProperty('gallery', [...(property.gallery ?? []), ...photos]);
    } catch (uploadError) {
      const code = uploadError instanceof Error ? uploadError.message : '';
      setError(code === 'file-type'
        ? 'Choisissez uniquement des fichiers image.'
        : code === 'file-size'
          ? 'Une image dépasse la taille maximale de 10 Mo.'
          : 'Impossible d’envoyer les images. Vérifiez votre connexion puis réessayez.');
    } finally {
      setUploading(null);
    }
  };

  useEffect(() => {
    const search = property.address.trim();
    if (search.length < 3) {
      const clearSuggestions = window.setTimeout(() => setAddressSuggestions([]), 0);
      return () => window.clearTimeout(clearSuggestions);
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(search)}&limit=5`, { signal: controller.signal });
        const result = await response.json() as { features?: Array<{ properties?: { label?: string; name?: string; housenumber?: string; city?: string; postcode?: string } }> };
        setAddressSuggestions((result.features ?? []).map((feature) => {
          const details = feature.properties ?? {};
          return { label: details.label ?? '', address: `${details.housenumber ? `${details.housenumber} ` : ''}${details.name ?? ''}`.trim(), city: details.city ?? '', postalCode: details.postcode ?? '' };
        }).filter((item) => item.address));
      } catch (searchError) {
        if ((searchError as Error).name !== 'AbortError') setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 300);
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [property.address]);

  const validateStep = (step = currentStep) => {
    const errors: Record<string, string> = {};
    const hasValue = (value: string | undefined, key: string, message: string) => {
      if (!value?.trim()) errors[key] = message;
    };
    const phoneDigits = property.hostPhone.replace(/\D/g, '');

    if (step === 1) {
      if (property.name.trim().length < 3) errors.name = 'Saisissez un nom de logement d’au moins 3 caractères.';
      if (!property.type.trim()) errors.type = 'Choisissez un type de logement.';
      if (!Number.isInteger(property.capacity) || property.capacity < 1 || property.capacity > 30) errors.capacity = 'Indiquez un nombre de voyageurs entre 1 et 30.';
      if (!Number.isInteger(property.bedrooms) || property.bedrooms < 0 || property.bedrooms > 20) errors.bedrooms = 'Indiquez un nombre de chambres entre 0 et 20.';
      if (!/^\d{1,5}\s+.{3,}/.test(property.address.trim())) errors.address = 'Indiquez le numéro et le nom de la voie, par exemple « 12 rue des Fleurs ».';
      if (property.city.trim().length < 2) errors.city = 'Indiquez la ville.';
      if (!/^\d{5}$/.test(property.postalCode.trim())) errors.postalCode = 'Le code postal doit contenir exactement 5 chiffres.';
    }

    if (step === 2) {
      if (!/^\d{2}:\d{2}$/.test(property.checkIn)) errors.checkIn = 'Indiquez une heure d’arrivée.';
      if (!/^\d{2}:\d{2}$/.test(property.checkOut)) errors.checkOut = 'Indiquez une heure de départ.';
      hasValue(property.arrivalInstructions, 'arrivalInstructions', 'Décrivez les instructions d’arrivée.');
      hasValue(property.accessCode, 'accessCode', 'Indiquez le code ou le mode d’accès au logement.');
      hasValue(property.parkingInstructions, 'parkingInstructions', 'Indiquez les consignes de stationnement, même s’il n’y en a pas.');
      hasValue(property.departureInstructions, 'departureInstructions', 'Indiquez les consignes de départ.');
      hasValue(property.wifiName, 'wifiName', 'Indiquez le nom du réseau Wi‑Fi.');
      hasValue(property.wifiPassword, 'wifiPassword', 'Indiquez le mot de passe Wi‑Fi.');
      if (property.description.trim().length < 20) errors.description = 'Ajoutez une présentation d’au moins 20 caractères.';
    }

    if (step === 3 && !(property.amenities ?? []).some((item) => item.trim())) {
      errors.amenities = 'Ajoutez au moins un équipement.';
    }
    if (step === 4) {
      if (!(property.houseRules ?? []).some((item) => item.trim())) errors.houseRules = 'Ajoutez au moins une règle de la maison.';
      if (!(property.faqItems ?? []).some((item) => /\S\s[—-]\s\S/.test(item.trim()))) errors.faqItems = 'Ajoutez une question avec sa réponse au format « Question — Réponse ».';
    }
    if (step === 5) {
      const completePlace = (property.nearbyPlaces ?? []).some((place) => place.name.trim() && place.category.trim() && place.address.trim() && place.note.trim());
      if (!completePlace) errors.nearbyPlaces = 'Ajoutez au moins une bonne adresse complète : nom, catégorie, adresse et note.';
    }
    if (step === 6) {
      if (property.hostName.trim().length < 3) errors.hostName = 'Indiquez le nom complet du contact.';
      if (phoneDigits.length < 8 || phoneDigits.length > 15 || !/^\+?[0-9\s().-]+$/.test(property.hostPhone.trim())) errors.hostPhone = 'Saisissez un numéro de téléphone valide.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(property.hostEmail.trim())) errors.hostEmail = 'Saisissez une adresse e-mail valide.';
    }
    if (step === 7 && !property.coverImage.trim()) errors.coverImage = 'Choisissez ou importez une photo de couverture.';

    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError('Corrigez les champs signalés avant de continuer.');
      return false;
    }
    setError('');
    return true;
  };

  const goToNextStep = () => {
    if (!validateStep()) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length));
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const goToStep = (step: number) => {
    if (step > currentStep) {
      for (let previousStep = currentStep; previousStep < step; previousStep += 1) {
        if (!validateStep(previousStep)) return;
      }
    }
    setCurrentStep(step);
    setError('');
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const submitProperty = async () => {
    if (isSubmitting) return;
    for (let step = 1; step < steps.length; step += 1) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }
    setIsSubmitting(true);

    try {
      await firebaseAuthReady;
      const user = firebaseAuth.currentUser;
      if (!user) {
        setError('Votre session n’est plus active. Reconnectez-vous pour enregistrer ce logement.');
        return;
      }
      // The free plan is deliberately useful for a first property, while Pro
      // unlocks a portfolio of properties. The profile is read from Firestore
      // rather than trusting a value stored in the browser.
      const [profileSnapshot, propertiesSnapshot] = await Promise.all([
        getDoc(doc(firestore, 'profiles', user.uid)),
        getDocs(query(collection(firestore, 'properties'), where('ownerId', '==', user.uid))),
      ]);
      const plan = profileSnapshot.data()?.subscriptionPlan;
      const hasPaidPlan = plan === 'pro' || plan === 'business';
      if (!hasPaidPlan && propertiesSnapshot.size >= 1) {
        setError('La formule gratuite comprend un logement. Passez à Pro pour créer et gérer tous vos logements.');
        return;
      }
      const amenities = (property.amenities ?? [])
        .map((item) => item.trim())
        .filter(Boolean);
      const houseRules = (property.houseRules ?? [])
        .map((item) => item.trim())
        .filter(Boolean);
      const faqItems = (property.faqItems ?? [])
        .map((item) => item.trim())
        .filter(Boolean);
      const nearbyPlaces = (property.nearbyPlaces ?? [])
        .filter((place) => place.name.trim())
        .map((place) => ({
          name: place.name.trim(),
          category: place.category.trim() || 'Autre',
          address: place.address.trim(),
          note: place.note.trim(),
        }));
      const gallery = (property.gallery ?? [])
        .filter((photo) => photo.url.trim())
        .map((photo) => ({ url: photo.url.trim(), caption: photo.caption.trim() }));
      const propertyRef = doc(collection(firestore, 'properties'));
      const propertyPayload = {
        ownerId: user.uid,
        // The property id is the stable, unique token of its public guide.
        // It makes every shared link and QR code specific to this property.
        publicToken: propertyRef.id,
        name: property.name.trim(),
        type: property.type.trim(),
        address: property.address.trim(),
        postalCode: property.postalCode.trim(),
        city: property.city.trim(),
        capacity: property.capacity,
        bedrooms: property.bedrooms,
        checkIn: property.checkIn || '',
        checkOut: property.checkOut || '',
        wifiName: property.wifiName.trim(),
        wifiPassword: property.wifiPassword,
        description: property.description.trim(),
        hostName: property.hostName.trim(),
        hostPhone: property.hostPhone.trim(),
        hostEmail: property.hostEmail.trim().toLowerCase(),
        emergencyContact: property.emergencyContact?.trim() || '',
        coverImage: property.coverImage.trim(),
        status: property.status,
        arrivalInstructions: property.arrivalInstructions?.trim() || '',
        accessCode: property.accessCode?.trim() || '',
        parkingInstructions: property.parkingInstructions?.trim() || '',
        departureInstructions: property.departureInstructions?.trim() || '',
        welcomeTitle: property.welcomeTitle?.trim() || 'Bienvenue chez vous',
        accentColor: property.accentColor || '#d85b24',
        gallery,
        welcomeSubtitle: property.welcomeSubtitle?.trim() || '', hostMessage: property.hostMessage?.trim() || '', theme: property.theme ?? 'terra', language: property.language ?? 'fr', showWifi: property.showWifi ?? true, showMap: property.showMap ?? true, showFaq: property.showFaq ?? true, showGallery: property.showGallery ?? true,
        amenities,
        houseRules,
        faqItems,
        nearbyPlaces,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: property.status === 'published' ? serverTimestamp() : null,
      };
      const propertyId = propertyRef.id;
      const batch = writeBatch(firestore);
      batch.set(propertyRef, propertyPayload);
      batch.set(doc(firestore, 'public_guides', propertyId), {
        ...propertyPayload,
        propertyId,
        publishedAt: propertyPayload.publishedAt ?? serverTimestamp(),
      });
      await batch.commit();
      window.sessionStorage.setItem('livret-property-created', property.name.trim());
      router.push(ROUTES.OWNER_PROPERTIES);
    } catch (submissionError) {
      const code = submissionError instanceof Error ? submissionError.message : '';
      setError(
        code.includes('permission-denied')
          ? 'Firebase refuse l’enregistrement. Vérifiez votre connexion et les règles Firestore.'
          : 'Impossible d’enregistrer ce logement. Vérifiez les informations saisies.',
      );
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f3ef]">
      <OwnerSidebar />
      <MobileNavigation type="owner" />

      <div className="lg:ml-[250px]">
        <header className="sticky top-0 z-30 border-b border-[#e8e1da] bg-[#fbfaf8]/95 px-4 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(ROUTES.OWNER_PROPERTIES)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e2dcd5] bg-white text-[#25282a]"
                aria-label="Retour aux logements"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d85b24]">
                  Nouveau logement
                </p>
                <h1 className="truncate text-lg font-semibold text-[#1e2529] sm:text-xl">
                  Créer votre livret d’accueil
                </h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-xs text-[#77736f] sm:flex">
              <Save size={15} />
              Sauvegarde à la validation
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-28 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-8">
          <aside className="h-fit rounded-[1.6rem] border border-[#e6dfd8] bg-[#17232c] p-5 text-white lg:sticky lg:top-28">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  Progression
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {Math.round(progress)} %
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#ef8b64]">
                <currentStepData.icon size={21} />
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#df7045] transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 lg:block lg:space-y-2">
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isDone = currentStep > step.id;
                const isLocked = step.id > currentStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(step.id)}
                    disabled={isLocked}
                    aria-label={isLocked ? `${step.label} : validez l’étape en cours pour la déverrouiller` : step.label}
                    className={`flex w-full flex-col items-center gap-2 rounded-xl p-2 text-center lg:flex-row lg:gap-3 lg:p-3 lg:text-left ${
                      isActive ? 'bg-white text-[#17232c]' : isLocked ? 'cursor-not-allowed text-white/35' : 'text-white/65'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                        isActive
                          ? 'bg-[#f8e7df] text-[#d85b24]'
                          : isDone
                            ? 'bg-[#397d6d] text-white'
                            : 'bg-white/8 text-white/55'
                      }`}
                    >
                      {isDone ? <Check size={15} /> : step.id}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold leading-3 lg:text-sm lg:leading-normal">
                        {step.label}
                      </span>
                      <span
                        className={`mt-0.5 hidden truncate text-[10px] lg:block ${
                          isActive ? 'text-[#77736f]' : 'text-white/35'
                        }`}
                      >
                        {step.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-white/8 bg-white/5 p-4">
              <p className="text-xs font-semibold">Un livret déjà bien avancé</p>
              <p className="mt-1 text-[11px] leading-5 text-white/45">
                {completedFields} informations essentielles sur 12 sont prêtes.
              </p>
            </div>
          </aside>

          <form
            ref={formRef}
            onSubmit={(event) => event.preventDefault()}
            className="scroll-mt-24 overflow-hidden rounded-[1.8rem] border border-[#e6dfd8] bg-[#fbfaf8] shadow-[0_18px_50px_rgba(33,28,24,0.06)]"
          >
            <div className="border-b border-[#ebe5df] px-5 py-6 sm:px-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d85b24]">
                Étape {currentStep} sur {steps.length}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#1e2529] sm:text-3xl">
                {currentStepData.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#77736f]">
                {currentStep === 1 &&
                  'Commencez par les informations qui permettront à vos voyageurs d’identifier le logement.'}
                {currentStep === 2 &&
                  'Expliquez précisément comment arriver, entrer et se connecter.'}
                {currentStep === 3 &&
                  'Ajoutez tous les équipements disponibles dans le logement.'}
                {currentStep === 4 &&
                  'Personnalisez les règles de la maison et les réponses fréquentes.'}
                {currentStep === 5 &&
                  'Partagez vos restaurants, commerces et activités préférés.'}
                {currentStep === 6 &&
                  'Indiquez qui contacter pendant le séjour ou en cas d’urgence.'}
                {currentStep === 7 &&
                  'Choisissez la photo, le message et la couleur du livret.'}
                {currentStep === 8 &&
                  'Vérifiez les informations avant de publier le livret.'}
              </p>
            </div>

            <div className="min-h-[520px] p-5 sm:p-8">
              {currentStep === 1 && (
                <div className="space-y-7">
                  <FormSection
                    icon={Home}
                    title="Identité du logement"
                    description="Le nom sera visible en haut du livret voyageur."
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Nom du logement *" error={fieldErrors.name} className="sm:col-span-2">
                        <Input
                          value={property.name}
                          onChange={(event) =>
                            updateProperty('name', event.target.value)
                          }
                          placeholder="Ex. L’Atelier des Batignolles"
                          className={`${fieldClass} ${fieldErrors.name ? 'border-[#c4492f]' : ''}`}
                          aria-invalid={Boolean(fieldErrors.name)}
                          required
                        />
                      </Field>
                      <Field label="Type de logement *" error={fieldErrors.type}>
                        <select
                          value={property.type}
                          onChange={(event) =>
                            updateProperty('type', event.target.value)
                          }
                          className={`${fieldClass} w-full appearance-none border`}
                        >
                          <option>Appartement</option>
                          <option>Maison</option>
                          <option>Villa</option>
                          <option>Studio</option>
                          <option>Loft</option>
                          <option>Chalet</option>
                        </select>
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                      <Field label="Voyageurs *" error={fieldErrors.capacity}>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={property.capacity}
                            onChange={(event) =>
                              updateProperty(
                                'capacity',
                                Number(event.target.value)
                              )
                            }
                            className={`${fieldClass} ${fieldErrors.capacity ? 'border-[#c4492f]' : ''}`}
                            aria-invalid={Boolean(fieldErrors.capacity)}
                          />
                        </Field>
                      <Field label="Chambres *" error={fieldErrors.bedrooms}>
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            value={property.bedrooms}
                            onChange={(event) =>
                              updateProperty(
                                'bedrooms',
                                Number(event.target.value)
                              )
                            }
                            className={`${fieldClass} ${fieldErrors.bedrooms ? 'border-[#c4492f]' : ''}`}
                            aria-invalid={Boolean(fieldErrors.bedrooms)}
                          />
                        </Field>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection
                    icon={MapPin}
                    title="Adresse"
                    description="Elle servira au bouton d’itinéraire du livret."
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Adresse *" error={fieldErrors.address} className="sm:col-span-2">
                        <div className="relative">
                          <Input
                            value={property.address}
                            onChange={(event) => updateProperty('address', event.target.value)}
                            onBlur={() => window.setTimeout(() => setAddressSuggestions([]), 150)}
                            placeholder="12 rue des Batignolles"
                            className={`${fieldClass} ${fieldErrors.address ? 'border-[#c4492f]' : ''}`}
                            aria-invalid={Boolean(fieldErrors.address)}
                            autoComplete="street-address"
                            required
                          />
                          {isSearchingAddress && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8a837d]">Recherche…</span>}
                          {addressSuggestions.length > 0 && (
                            <div className="absolute inset-x-0 z-30 mt-2 overflow-hidden rounded-xl border border-[#ded8d1] bg-white shadow-[0_16px_36px_rgba(31,41,37,.15)]">
                              {addressSuggestions.map((suggestion) => (
                                <button key={suggestion.label} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { updateProperty('address', suggestion.address); updateProperty('city', suggestion.city); updateProperty('postalCode', suggestion.postalCode); setAddressSuggestions([]); }} className="block w-full border-b border-[#eee8e2] px-4 py-3 text-left text-sm text-[#29302d] last:border-0 hover:bg-[#f8f5f1]">
                                  <span className="block font-medium">{suggestion.address}</span><span className="mt-0.5 block text-xs text-[#77736f]">{suggestion.postalCode} {suggestion.city}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </Field>
                      <Field label="Ville *" error={fieldErrors.city}>
                        <Input
                          value={property.city}
                          onChange={(event) =>
                            updateProperty('city', event.target.value)
                          }
                          placeholder="Paris"
                          className={`${fieldClass} ${fieldErrors.city ? 'border-[#c4492f]' : ''}`}
                          aria-invalid={Boolean(fieldErrors.city)}
                          required
                        />
                      </Field>
                      <Field label="Code postal *" error={fieldErrors.postalCode}>
                        <Input
                          value={property.postalCode}
                          onChange={(event) =>
                            updateProperty('postalCode', event.target.value)
                          }
                          placeholder="75008"
                          inputMode="numeric"
                          pattern="[0-9]{5}"
                          maxLength={5}
                          className={`${fieldClass} ${fieldErrors.postalCode ? 'border-[#c4492f]' : ''}`}
                          aria-invalid={Boolean(fieldErrors.postalCode)}
                          required
                        />
                      </Field>
                    </div>
                  </FormSection>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-7">
                  <FormSection
                    icon={Clock3}
                    title="Arrivée et départ"
                    description="Ces horaires seront affichés dès le début du livret."
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Heure d’arrivée *" error={fieldErrors.checkIn}>
                        <Input
                          type="time"
                          value={property.checkIn}
                          onChange={(event) =>
                            updateProperty('checkIn', event.target.value)
                          }
                          className={`${fieldClass} ${fieldErrors.checkIn ? 'border-[#c4492f]' : ''}`}
                          aria-invalid={Boolean(fieldErrors.checkIn)}
                        />
                      </Field>
                      <Field label="Heure de départ *" error={fieldErrors.checkOut}>
                        <Input
                          type="time"
                          value={property.checkOut}
                          onChange={(event) =>
                            updateProperty('checkOut', event.target.value)
                          }
                          className={`${fieldClass} ${fieldErrors.checkOut ? 'border-[#c4492f]' : ''}`}
                          aria-invalid={Boolean(fieldErrors.checkOut)}
                        />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection
                    icon={KeyRound}
                    title="Accès au logement"
                    description="Décrivez chaque étape depuis l’arrivée dans la rue jusqu’à l’ouverture de la porte."
                  >
                    <div className="space-y-5">
                      <Field label="Instructions d’arrivée *" error={fieldErrors.arrivalInstructions}>
                        <Textarea
                          value={property.arrivalInstructions}
                          onChange={(event) =>
                            updateProperty('arrivalInstructions', event.target.value)
                          }
                          placeholder="Ex. Entrez par le portail bleu, traversez la cour puis montez au 2e étage…"
                          className="min-h-28 resize-none rounded-xl border-[#ded8d1] bg-white p-4 shadow-none"
                          required
                        />
                      </Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Code d’accès / boîte à clés *" error={fieldErrors.accessCode}>
                          <Input
                            value={property.accessCode}
                            onChange={(event) =>
                              updateProperty('accessCode', event.target.value)
                            }
                            placeholder="Digicode, interphone, boîte à clés…"
                            className={fieldClass}
                          />
                        </Field>
                      <Field label="Stationnement *" error={fieldErrors.parkingInstructions}>
                          <Input
                            value={property.parkingInstructions}
                            onChange={(event) =>
                              updateProperty('parkingInstructions', event.target.value)
                            }
                            placeholder="Parking, rue conseillée…"
                            className={fieldClass}
                          />
                        </Field>
                      </div>
                      <Field label="Consignes de départ *" error={fieldErrors.departureInstructions}>
                        <Textarea
                          value={property.departureInstructions}
                          onChange={(event) =>
                            updateProperty('departureInstructions', event.target.value)
                          }
                          placeholder="Ex. Déposez les clés sur la table et fermez simplement la porte…"
                          className="min-h-24 resize-none rounded-xl border-[#ded8d1] bg-white p-4 shadow-none"
                        />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection
                    icon={Wifi}
                    title="Connexion Wi-Fi"
                    description="Les voyageurs pourront copier ces informations en un geste."
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Nom du réseau *" error={fieldErrors.wifiName}>
                        <Input
                          value={property.wifiName}
                          onChange={(event) =>
                            updateProperty('wifiName', event.target.value)
                          }
                          placeholder="MonAppartement_5G"
                          className={fieldClass}
                        />
                      </Field>
                      <Field label="Mot de passe *" error={fieldErrors.wifiPassword}>
                        <Input
                          value={property.wifiPassword}
                          onChange={(event) =>
                            updateProperty('wifiPassword', event.target.value)
                          }
                          placeholder="Mot de passe Wi-Fi"
                          className={fieldClass}
                        />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection
                    icon={Sparkles}
                    title="Message de bienvenue"
                    description="Une courte présentation donne immédiatement le ton du séjour."
                  >
                    <Field label="Présentation *" error={fieldErrors.description}>
                      <Textarea
                        value={property.description}
                        onChange={(event) =>
                          updateProperty('description', event.target.value)
                        }
                        placeholder="Décrivez l’ambiance du logement et ce qui le rend unique…"
                        className="min-h-32 resize-none rounded-xl border-[#ded8d1] bg-white p-4 shadow-none focus-visible:border-[#d85b24] focus-visible:ring-[#d85b24]/15"
                        required
                      />
                    </Field>
                  </FormSection>
                </div>
              )}

              {currentStep === 3 && (
                <div><EditableStringList icon={Wifi} title="Équipements du logement" description="Ajoutez chaque équipement que le voyageur pourra retrouver dans le livret." items={property.amenities ?? []} placeholder="Ex. Machine à café, climatisation, lave-linge…" onChange={(items) => updateProperty('amenities', items)} addLabel="Ajouter un équipement" />{fieldErrors.amenities && <p role="alert" className="mt-3 text-sm font-medium text-[#b8453c]">{fieldErrors.amenities}</p>}</div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  <EditableStringList
                    icon={ListChecks}
                    title="Règles de la maison"
                    description="Une règle par ligne pour une lecture claire côté voyageur."
                    items={property.houseRules ?? []}
                    placeholder="Ex. Merci de respecter le calme après 22 h"
                    onChange={(items) => updateProperty('houseRules', items)}
                    addLabel="Ajouter une règle"
                  />
                  <EditableStringList
                    icon={BookOpen}
                    title="Questions fréquentes"
                    description="Saisissez une question et sa réponse sous la forme « Question — Réponse »."
                    items={property.faqItems ?? []}
                    placeholder="Ex. Où sont les poubelles ? — Dans la cour."
                    onChange={(items) => updateProperty('faqItems', items)}
                    addLabel="Ajouter une question"
                  />
                  {(fieldErrors.houseRules || fieldErrors.faqItems) && <p role="alert" className="text-sm font-medium text-[#b8453c]">{fieldErrors.houseRules || fieldErrors.faqItems}</p>}
                </div>
              )}

              {currentStep === 5 && (
                <div><NearbyPlacesEditor places={property.nearbyPlaces ?? []} onChange={(places) => updateProperty('nearbyPlaces', places)} />{fieldErrors.nearbyPlaces && <p role="alert" className="mt-3 text-sm font-medium text-[#b8453c]">{fieldErrors.nearbyPlaces}</p>}</div>
              )}

              {currentStep === 6 && (
                <FormSection
                  icon={UserRound}
                  title="Votre contact sur place"
                  description="Cette personne sera mise en avant dans la carte « Votre hôte »."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nom complet *" error={fieldErrors.hostName} className="sm:col-span-2">
                      <Input
                        value={property.hostName}
                        onChange={(event) =>
                          updateProperty('hostName', event.target.value)
                        }
                        placeholder="Marie Dupont"
                        className={fieldClass}
                        required
                      />
                    </Field>
                      <Field label="Téléphone *" error={fieldErrors.hostPhone}>
                      <Input
                          type="tel"
                        value={property.hostPhone}
                        onChange={(event) =>
                          updateProperty('hostPhone', event.target.value)
                        }
                          placeholder="+33 6 12 34 56 78"
                          inputMode="tel"
                          autoComplete="tel"
                          pattern="\\+?[0-9 .()-]{8,20}"
                        className={fieldClass}
                        required
                      />
                    </Field>
                      <Field label="Adresse e-mail *" error={fieldErrors.hostEmail}>
                      <Input
                        type="email"
                        value={property.hostEmail}
                        onChange={(event) =>
                          updateProperty('hostEmail', event.target.value)
                        }
                          placeholder="marie@exemple.fr"
                          autoComplete="email"
                        className={fieldClass}
                        required
                      />
                    </Field>
                  </div>

                  <Field label="Numéro d’urgence ou contact secondaire" className="mt-5">
                    <Input
                      value={property.emergencyContact}
                      onChange={(event) =>
                        updateProperty('emergencyContact', event.target.value)
                      }
                      placeholder="Ex. Conciergerie : +33 6…"
                      className={fieldClass}
                    />
                  </Field>

                  <div className="mt-6 rounded-2xl bg-[#edf5f2] p-4 text-sm leading-6 text-[#39675d]">
                    Les coordonnées sont uniquement visibles par les voyageurs
                    disposant du lien privé du livret.
                  </div>
                </FormSection>
              )}

              {currentStep === 7 && (
                <div className="space-y-7">
                  <FormSection
                    icon={ImageIcon}
                    title="Photo de couverture"
                    description="Choisissez une image qui représente immédiatement le logement."
                  >
                    <div className="relative aspect-[16/8] overflow-hidden rounded-2xl bg-[#ece7e1]">
                      <Image
                        src={property.coverImage}
                        alt="Aperçu de la couverture"
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 700px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
                          {property.type} · {property.city || 'Votre ville'}
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                          {property.name || 'Nom du logement'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {coverPresets.map((image) => (
                        <button
                          key={image}
                          type="button"
                          onClick={() => updateProperty('coverImage', image)}
                          className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 ${
                            property.coverImage === image
                              ? 'border-[#d85b24]'
                              : 'border-transparent'
                          }`}
                        >
                          <Image
                            src={image}
                            alt=""
                            fill
                            unoptimized
                            sizes="150px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="sr-only"
                      onChange={(event) => void uploadCoverImage(event)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 w-full rounded-xl border-dashed"
                      disabled={uploading !== null}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading === 'cover' ? 'Envoi de la couverture…' : 'Importer depuis mon appareil'}
                    </Button>
                    <p className="mt-2 text-xs leading-5 text-[#77736f]">JPG, PNG, WebP ou AVIF · 10 Mo maximum.</p>
                    {fieldErrors.coverImage && <p role="alert" className="mt-2 text-sm font-medium text-[#b8453c]">{fieldErrors.coverImage}</p>}
                  </FormSection>

                  <FormSection
                    icon={ImageIcon}
                    title="Galerie photos"
                    description="Ajoutez les photos de chaque pièce avec une courte description visible par vos voyageurs."
                  >
                    <div className="space-y-4">
                      {(property.gallery ?? []).map((photo, index) => (
                        <div key={index} className="grid gap-3 rounded-2xl border border-[#e6dfd8] bg-white p-3 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-center">
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f3eee8]">
                            {photo.url ? <Image src={photo.url} alt={photo.caption || 'Photo du logement'} fill unoptimized sizes="120px" className="object-cover" /> : <ImageIcon className="absolute inset-0 m-auto text-[#a39c95]" size={24} />}
                          </div>
                          <Input value={photo.url} onChange={(event) => updateProperty('gallery', (property.gallery ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="URL de la photo" className={fieldClass} />
                          <Input value={photo.caption} onChange={(event) => updateProperty('gallery', (property.gallery ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, caption: event.target.value } : item))} placeholder="Ex. Chambre principale" className={fieldClass} />
                          <button type="button" onClick={() => updateProperty('gallery', (property.gallery ?? []).filter((_, itemIndex) => itemIndex !== index))} className="mx-auto rounded-xl p-3 text-[#b8453c] hover:bg-[#fdeceb]" aria-label="Supprimer cette photo"><Trash2 size={18} /></button>
                        </div>
                      ))}
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        multiple
                        className="sr-only"
                        onChange={(event) => void uploadGalleryImages(event)}
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()} disabled={uploading !== null} className="w-full rounded-xl border-dashed"><Upload className="mr-2 h-4 w-4" />{uploading === 'gallery' ? 'Envoi des photos…' : 'Importer depuis mon appareil'}</Button>
                        <Button type="button" variant="outline" onClick={() => updateProperty('gallery', [...(property.gallery ?? []), { url: '', caption: '' }])} disabled={uploading !== null} className="w-full rounded-xl border-dashed"><Plus className="mr-2 h-4 w-4" />Ajouter par URL</Button>
                      </div>
                      <p className="text-xs leading-5 text-[#77736f]">Importez plusieurs photos depuis votre appareil, ou collez une URL. JPG, PNG, WebP ou AVIF · 10 Mo maximum par image.</p>
                    </div>
                  </FormSection>

                  <FormSection
                    icon={Palette}
                    title="Identité du livret"
                    description="Personnalisez le message principal et la couleur d’accent."
                  >
                    <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                      <Field label="Titre de bienvenue">
                        <Input
                          value={property.welcomeTitle}
                          onChange={(event) =>
                            updateProperty('welcomeTitle', event.target.value)
                          }
                          placeholder="Bienvenue chez vous"
                          className={fieldClass}
                        />
                      </Field>
                      <Field label="Couleur">
                        <input
                          type="color"
                          value={property.accentColor}
                          onChange={(event) =>
                            updateProperty('accentColor', event.target.value)
                          }
                          className="h-12 w-full cursor-pointer rounded-xl border border-[#ded8d1] bg-white p-1 sm:w-20"
                        />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection icon={Sparkles} title="Expérience voyageur" description="Choisissez l’ambiance et les informations visibles dans le guide public.">
                    <div className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Sous-titre d’accueil"><Input value={property.welcomeSubtitle} onChange={(event) => updateProperty('welcomeSubtitle', event.target.value)} placeholder="Votre guide privé pour un séjour serein" className={fieldClass} /></Field>
                        <Field label="Langue du guide"><select value={property.language} onChange={(event) => updateProperty('language', event.target.value as PropertyDraft['language'])} className={`${fieldClass} w-full appearance-none border`}><option value="fr">Français</option><option value="en">English</option></select></Field>
                      </div>
                      <Field label="Message personnel de l’hôte"><Textarea value={property.hostMessage} onChange={(event) => updateProperty('hostMessage', event.target.value)} placeholder="Ex. Je vous souhaite un excellent séjour, n’hésitez pas à me contacter." className="min-h-24 resize-none rounded-xl border-[#ded8d1] bg-white p-4 shadow-none" /></Field>
                      <div><p className="mb-3 text-sm font-medium text-[#3e4641]">Thème visuel</p><div className="grid grid-cols-3 gap-3">{([{ id: 'terra', label: 'Terracotta', color: '#d85b24' }, { id: 'ocean', label: 'Océan', color: '#1d6f8c' }, { id: 'sage', label: 'Sauge', color: '#367566' }] as const).map((theme) => <button key={theme.id} type="button" onClick={() => updateProperty('theme', theme.id)} className={`rounded-xl border-2 p-3 text-left ${property.theme === theme.id ? 'border-[#17232c]' : 'border-[#e6dfd8]'}`}><span className="block h-7 rounded-lg" style={{ backgroundColor: theme.color }} /><span className="mt-2 block text-xs font-semibold">{theme.label}</span></button>)}</div></div>
                      <div className="grid gap-2 sm:grid-cols-2">{([{ key: 'showWifi', label: 'Afficher le Wi‑Fi' }, { key: 'showMap', label: 'Afficher la carte' }, { key: 'showFaq', label: 'Afficher la FAQ' }, { key: 'showGallery', label: 'Afficher la galerie' }] as const).map((option) => <label key={option.key} className="flex items-center gap-3 rounded-xl border border-[#e6dfd8] bg-white p-3 text-sm font-medium"><input type="checkbox" checked={property[option.key] ?? true} onChange={(event) => updateProperty(option.key, event.target.checked)} className="h-4 w-4 accent-[#d85b24]" />{option.label}</label>)}</div>
                    </div>
                  </FormSection>
                </div>
              )}

              {currentStep === 8 && (
                <div className="space-y-7">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SummaryCard
                      icon={MapPin}
                      label="Adresse"
                      value={`${property.address}, ${property.postalCode} ${property.city}`}
                    />
                    <SummaryCard
                      icon={Users}
                      label="Capacité"
                      value={`${property.capacity} voyageurs · ${property.bedrooms} chambre${property.bedrooms > 1 ? 's' : ''}`}
                    />
                    <SummaryCard
                      icon={Clock3}
                      label="Séjour"
                      value={`Arrivée ${property.checkIn} · Départ ${property.checkOut}`}
                    />
                    <SummaryCard
                      icon={UserRound}
                      label="Contact"
                      value={property.hostName}
                    />
                    <SummaryCard
                      icon={Wifi}
                      label="Équipements"
                      value={`${property.amenities?.length ?? 0} éléments`}
                    />
                    <SummaryCard
                      icon={Utensils}
                      label="Bonnes adresses"
                      value={`${property.nearbyPlaces?.filter((place) => place.name).length ?? 0} adresses`}
                    />
                  </div>

                  <div className="rounded-2xl border border-[#e6dfd8] bg-white p-5">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="font-semibold text-[#1e2529]">
                          Publier dès maintenant
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#77736f]">
                          Le livret restera modifiable après sa création.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={property.status === 'published'}
                        aria-label="Publier le livret dès maintenant"
                        onClick={togglePublication}
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d85b24] focus-visible:ring-offset-2 ${
                          property.status === 'published'
                            ? 'bg-[#397d6d]'
                            : 'bg-[#d8d3cd]'
                        }`}
                      >
                        <span
                          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            property.status === 'published'
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="mt-6 rounded-xl bg-[#fcebe5] px-4 py-3 text-sm font-medium text-[#aa4327]"
                >
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#ebe5df] bg-white px-5 py-4 sm:px-8">
              <button
                type="button"
                onClick={() =>
                  currentStep === 1
                    ? router.push(ROUTES.OWNER_PROPERTIES)
                    : goToStep(currentStep - 1)
                }
                className="flex h-11 items-center gap-2 rounded-xl border border-[#dfd9d2] px-4 text-sm font-semibold text-[#4d4c49]"
              >
                <ArrowLeft size={16} />
                {currentStep === 1 ? 'Annuler' : 'Précédent'}
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="flex h-11 items-center gap-2 rounded-xl bg-[#17232c] px-5 text-sm font-semibold text-white"
                >
                  Continuer
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void submitProperty()}
                  disabled={isSubmitting}
                  className="flex h-11 items-center gap-2 rounded-xl bg-[#d85b24] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={16} />
                  {isSubmitting ? 'Enregistrement…' : 'Créer le logement'}
                </button>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f8e7df] text-[#d85b24]">
          <Icon size={19} />
        </span>
        <div>
          <h3 className="font-semibold text-[#1e2529]">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-[#77736f]">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  className = '',
  error,
  children,
}: {
  label: string;
  className?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-xs font-semibold text-[#4f5151]">{label}</span>
      {children}
      {error && <span role="alert" className="block text-xs leading-5 text-[#b8453c]">{error}</span>}
    </label>
  );
}

function EditableStringList({
  icon,
  title,
  description,
  items,
  placeholder,
  addLabel,
  onChange,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  items: string[];
  placeholder: string;
  addLabel: string;
  onChange: (items: string[]) => void;
}) {
  return (
    <FormSection icon={icon} title={title} description={description}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3eee9] text-xs font-bold text-[#8a8179]">
              {index + 1}
            </span>
            <Input
              value={item}
              onChange={(event) => {
                const nextItems = [...items];
                nextItems[index] = event.target.value;
                onChange(nextItems);
              }}
              placeholder={placeholder}
              className={fieldClass}
            />
            <button
              type="button"
              aria-label={`Supprimer ${item || 'cet élément'}`}
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#a59d96] transition hover:bg-[#fcebe5] hover:text-[#b34a2d]"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d6cec6] bg-white text-sm font-semibold text-[#d85b24]"
        >
          <Plus size={17} />
          {addLabel}
        </button>
      </div>
    </FormSection>
  );
}

type NearbyPlace = NonNullable<OwnerProperty['nearbyPlaces']>[number];

function NearbyPlacesEditor({
  places,
  onChange,
}: {
  places: NearbyPlace[];
  onChange: (places: NearbyPlace[]) => void;
}) {
  const updatePlace = (
    index: number,
    key: keyof NearbyPlace,
    value: string
  ) => {
    const nextPlaces = [...places];
    nextPlaces[index] = { ...nextPlaces[index], [key]: value };
    onChange(nextPlaces);
  };

  return (
    <FormSection
      icon={Utensils}
      title="Bonnes adresses autour du logement"
      description="Ajoutez les restaurants, cafés, commerces, transports et activités recommandés."
    >
      <div className="space-y-4">
        {places.map((place, index) => (
          <div
            key={`place-${index}`}
            className="rounded-2xl border border-[#e5ded7] bg-white p-4 sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#29302d]">
                Adresse {index + 1}
              </p>
              <button
                type="button"
                aria-label="Supprimer cette adresse"
                onClick={() =>
                  onChange(places.filter((_, placeIndex) => placeIndex !== index))
                }
                className="text-[#a59d96] hover:text-[#b34a2d]"
              >
                <Trash2 size={17} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom">
                <Input
                  value={place.name}
                  onChange={(event) => updatePlace(index, 'name', event.target.value)}
                  placeholder="Ex. Le Comptoir des Batignolles"
                  className={fieldClass}
                />
              </Field>
              <Field label="Catégorie">
                <select
                  value={place.category}
                  onChange={(event) =>
                    updatePlace(index, 'category', event.target.value)
                  }
                  className={`${fieldClass} w-full appearance-none border`}
                >
                  <option>Restaurant</option>
                  <option>Café</option>
                  <option>Commerce</option>
                  <option>Transport</option>
                  <option>Activité</option>
                  <option>Santé</option>
                </select>
              </Field>
              <Field label="Adresse" className="sm:col-span-2">
                <Input
                  value={place.address}
                  onChange={(event) =>
                    updatePlace(index, 'address', event.target.value)
                  }
                  placeholder="Adresse complète"
                  className={fieldClass}
                />
              </Field>
              <Field label="Votre conseil" className="sm:col-span-2">
                <Textarea
                  value={place.note}
                  onChange={(event) => updatePlace(index, 'note', event.target.value)}
                  placeholder="Pourquoi vous recommandez cette adresse, horaires, plat préféré…"
                  className="min-h-20 resize-none rounded-xl border-[#ded8d1] bg-white p-4 shadow-none"
                />
              </Field>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([
              ...places,
              { name: '', category: 'Restaurant', address: '', note: '' },
            ])
          }
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d6cec6] bg-white text-sm font-semibold text-[#d85b24]"
        >
          <Plus size={18} />
          Ajouter une bonne adresse
        </button>
      </div>
    </FormSection>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#e6dfd8] bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3eee8] text-[#d85b24]">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#918b85]">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold leading-5 text-[#24292c]">
          {value}
        </p>
      </div>
    </div>
  );
}
