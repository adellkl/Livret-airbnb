'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/config/routes';
import {
  type OwnerProperty,
} from '@/lib/owner-properties';
import { createClient } from '@/lib/supabase/client';
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
};

const fieldClass =
  'h-12 rounded-xl border-[#ded8d1] bg-white px-4 shadow-none focus-visible:border-[#d85b24] focus-visible:ring-[#d85b24]/15';

export default function NewPropertyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [property, setProperty] = useState<PropertyDraft>(initialProperty);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
  };

  const validateStep = () => {
    if (
      currentStep === 1 &&
      (!property.name ||
        !property.address ||
        !property.city ||
        !property.postalCode)
    ) {
      setError('Renseignez le nom et l’adresse complète du logement.');
      return false;
    }

    if (
      currentStep === 2 &&
      (!property.description || !property.arrivalInstructions)
    ) {
      setError('Ajoutez le message de bienvenue et les instructions d’arrivée.');
      return false;
    }

    if (
      currentStep === 6 &&
      (!property.hostName || !property.hostPhone || !property.hostEmail)
    ) {
      setError('Complétez les coordonnées de la personne à contacter.');
      return false;
    }

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
    setCurrentStep(step);
    setError('');
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const submitProperty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep() || isSubmitting) return;
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('Votre session a expiré. Reconnectez-vous pour enregistrer ce logement.');
      setIsSubmitting(false);
      return;
    }

    const { data: createdProperty, error: propertyError } = await supabase
      .from('properties')
      .insert({
        owner_id: user.id,
        name: property.name.trim(),
        property_type: property.type.trim(),
        address_line1: property.address.trim(),
        postal_code: property.postalCode.trim(),
        city: property.city.trim(),
        capacity: property.capacity,
        bedrooms: property.bedrooms,
        check_in_time: property.checkIn || null,
        check_out_time: property.checkOut || null,
        wifi_name: property.wifiName.trim() || null,
        wifi_password: property.wifiPassword || null,
        description: property.description.trim(),
        host_name: property.hostName.trim(),
        host_phone: property.hostPhone.trim(),
        host_email: property.hostEmail.trim().toLowerCase(),
        emergency_contact: property.emergencyContact?.trim() || null,
        cover_image_url: property.coverImage.trim() || null,
        status: property.status,
        arrival_instructions: property.arrivalInstructions?.trim() || null,
        access_instructions: property.accessCode?.trim() || null,
        parking_instructions: property.parkingInstructions?.trim() || null,
        departure_instructions: property.departureInstructions?.trim() || null,
        welcome_title: property.welcomeTitle?.trim() || 'Bienvenue chez vous',
        accent_color: property.accentColor || '#d85b24',
        published_at: property.status === 'published' ? new Date().toISOString() : null,
      })
      .select('id, name')
      .single();

    if (propertyError || !createdProperty) {
      setError('Impossible d’enregistrer ce logement. Vérifiez les informations saisies.');
      setIsSubmitting(false);
      return;
    }

    const propertyId = createdProperty.id;
    const writes = [
      property.amenities?.length ? supabase.from('property_amenities').insert(property.amenities.filter(Boolean).map((name, position) => ({ property_id: propertyId, name: name.trim(), position }))) : null,
      property.houseRules?.length ? supabase.from('property_house_rules').insert(property.houseRules.filter(Boolean).map((ruleText, position) => ({ property_id: propertyId, rule_text: ruleText.trim(), position }))) : null,
      property.faqItems?.length ? supabase.from('property_faqs').insert(property.faqItems.filter(Boolean).map((item, position) => {
        const [question, ...answerParts] = item.split('—');
        return { property_id: propertyId, question: question.trim(), answer: answerParts.join('—').trim() || 'Réponse à compléter.', position };
      })) : null,
      property.nearbyPlaces?.filter((place) => place.name.trim()).length ? supabase.from('nearby_places').insert(property.nearbyPlaces.filter((place) => place.name.trim()).map((place, position) => ({ property_id: propertyId, name: place.name.trim(), category: place.category.trim() || 'Autre', address: place.address.trim() || null, note: place.note.trim() || null, position }))) : null,
    ].filter(Boolean);
    const results = await Promise.all(writes);
    if (results.some((result) => result?.error)) {
      setError('Le logement a été créé, mais une partie du contenu doit être ajoutée de nouveau.');
      setIsSubmitting(false);
      return;
    }

    window.sessionStorage.setItem(
      'livret-property-created',
      createdProperty.name
    );
    router.push(ROUTES.OWNER_PROPERTIES);
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

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className={`flex w-full flex-col items-center gap-2 rounded-xl p-2 text-center lg:flex-row lg:gap-3 lg:p-3 lg:text-left ${
                      isActive ? 'bg-white text-[#17232c]' : 'text-white/65'
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
            onSubmit={submitProperty}
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
                      <Field label="Nom du logement" className="sm:col-span-2">
                        <Input
                          value={property.name}
                          onChange={(event) =>
                            updateProperty('name', event.target.value)
                          }
                          placeholder="Ex. L’Atelier des Batignolles"
                          className={fieldClass}
                          required
                        />
                      </Field>
                      <Field label="Type de logement">
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
                        <Field label="Voyageurs">
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
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Chambres">
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
                            className={fieldClass}
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
                      <Field label="Adresse" className="sm:col-span-2">
                        <Input
                          value={property.address}
                          onChange={(event) =>
                            updateProperty('address', event.target.value)
                          }
                          placeholder="12 rue des Batignolles"
                          className={fieldClass}
                          required
                        />
                      </Field>
                      <Field label="Ville">
                        <Input
                          value={property.city}
                          onChange={(event) =>
                            updateProperty('city', event.target.value)
                          }
                          placeholder="Paris"
                          className={fieldClass}
                          required
                        />
                      </Field>
                      <Field label="Code postal">
                        <Input
                          value={property.postalCode}
                          onChange={(event) =>
                            updateProperty('postalCode', event.target.value)
                          }
                          placeholder="75008"
                          className={fieldClass}
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
                      <Field label="Heure d’arrivée">
                        <Input
                          type="time"
                          value={property.checkIn}
                          onChange={(event) =>
                            updateProperty('checkIn', event.target.value)
                          }
                          className={fieldClass}
                        />
                      </Field>
                      <Field label="Heure de départ">
                        <Input
                          type="time"
                          value={property.checkOut}
                          onChange={(event) =>
                            updateProperty('checkOut', event.target.value)
                          }
                          className={fieldClass}
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
                      <Field label="Instructions d’arrivée">
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
                        <Field label="Code d’accès / boîte à clés">
                          <Input
                            value={property.accessCode}
                            onChange={(event) =>
                              updateProperty('accessCode', event.target.value)
                            }
                            placeholder="Digicode, interphone, boîte à clés…"
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Stationnement">
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
                      <Field label="Consignes de départ">
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
                      <Field label="Nom du réseau">
                        <Input
                          value={property.wifiName}
                          onChange={(event) =>
                            updateProperty('wifiName', event.target.value)
                          }
                          placeholder="MonAppartement_5G"
                          className={fieldClass}
                        />
                      </Field>
                      <Field label="Mot de passe">
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
                    <Field label="Présentation">
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
                <EditableStringList
                  icon={Wifi}
                  title="Équipements du logement"
                  description="Ajoutez chaque équipement que le voyageur pourra retrouver dans le livret."
                  items={property.amenities ?? []}
                  placeholder="Ex. Machine à café, climatisation, lave-linge…"
                  onChange={(items) => updateProperty('amenities', items)}
                  addLabel="Ajouter un équipement"
                />
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
                </div>
              )}

              {currentStep === 5 && (
                <NearbyPlacesEditor
                  places={property.nearbyPlaces ?? []}
                  onChange={(places) => updateProperty('nearbyPlaces', places)}
                />
              )}

              {currentStep === 6 && (
                <FormSection
                  icon={UserRound}
                  title="Votre contact sur place"
                  description="Cette personne sera mise en avant dans la carte « Votre hôte »."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nom complet" className="sm:col-span-2">
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
                    <Field label="Téléphone">
                      <Input
                        type="tel"
                        value={property.hostPhone}
                        onChange={(event) =>
                          updateProperty('hostPhone', event.target.value)
                        }
                        placeholder="+33 6 12 34 56 78"
                        className={fieldClass}
                        required
                      />
                    </Field>
                    <Field label="Adresse e-mail">
                      <Input
                        type="email"
                        value={property.hostEmail}
                        onChange={(event) =>
                          updateProperty('hostEmail', event.target.value)
                        }
                        placeholder="marie@exemple.fr"
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
                        onClick={() =>
                          updateProperty(
                            'status',
                            property.status === 'published'
                              ? 'draft'
                              : 'published'
                          )
                        }
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                          property.status === 'published'
                            ? 'bg-[#397d6d]'
                            : 'bg-[#d8d3cd]'
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
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
                  type="submit"
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
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-xs font-semibold text-[#4f5151]">{label}</span>
      {children}
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
