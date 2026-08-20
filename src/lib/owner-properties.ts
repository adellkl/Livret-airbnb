export type PropertyStatus = 'draft' | 'published';

export interface OwnerProperty {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  postalCode: string;
  capacity: number;
  bedrooms: number;
  checkIn: string;
  checkOut: string;
  wifiName: string;
  wifiPassword: string;
  description: string;
  hostName: string;
  hostPhone: string;
  hostEmail: string;
  coverImage: string;
  status: PropertyStatus;
  views: number;
  completion: number;
  createdAt?: string;
  updatedAt: string;
  arrivalInstructions?: string;
  accessCode?: string;
  parkingInstructions?: string;
  departureInstructions?: string;
  amenities?: string[];
  houseRules?: string[];
  faqItems?: string[];
  nearbyPlaces?: Array<{
    name: string;
    category: string;
    address: string;
    note: string;
  }>;
  emergencyContact?: string;
  welcomeTitle?: string;
  accentColor?: string;
  gallery?: Array<{ url: string; caption: string }>;
  welcomeSubtitle?: string;
  hostMessage?: string;
  theme?: 'terra' | 'ocean' | 'sage';
  language?: 'fr' | 'en';
  showWifi?: boolean;
  showMap?: boolean;
  showFaq?: boolean;
  showGallery?: boolean;
}

export const DEFAULT_OWNER_PROPERTIES: OwnerProperty[] = [
  {
    id: 'atelier-batignolles',
    name: "L’Atelier des Batignolles",
    type: 'Appartement',
    address: '12 rue des Batignolles',
    city: 'Paris',
    postalCode: '75008',
    capacity: 4,
    bedrooms: 2,
    checkIn: '15:00',
    checkOut: '11:00',
    wifiName: 'Atelier_Batignolles',
    wifiPassword: 'bienvenue2025',
    description:
      'Un appartement lumineux et chaleureux au cœur des Batignolles.',
    hostName: 'Marie Dupont',
    hostPhone: '+33 6 12 34 56 78',
    hostEmail: 'marie@atelier-batignolles.fr',
    coverImage:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    status: 'published',
    views: 423,
    completion: 100,
    updatedAt: 'Aujourd’hui',
  },
  {
    id: 'villa-belle-vue',
    name: 'Villa Belle Vue',
    type: 'Villa',
    address: '18 corniche des Oliviers',
    city: 'Nice',
    postalCode: '06000',
    capacity: 8,
    bedrooms: 4,
    checkIn: '16:00',
    checkOut: '10:00',
    wifiName: 'Villa_Belle_Vue',
    wifiPassword: 'soleil2026',
    description: 'Une villa avec vue mer, piscine et jardin méditerranéen.',
    hostName: 'Sophie Martin',
    hostPhone: '+33 6 22 45 78 90',
    hostEmail: 'sophie@belle-vue.fr',
    coverImage:
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&h=800&fit=crop',
    status: 'published',
    views: 312,
    completion: 92,
    updatedAt: 'Il y a 5 jours',
  },
  {
    id: 'toits-de-lyon',
    name: 'Les Toits de Lyon',
    type: 'Loft',
    address: '8 montée Saint-Sébastien',
    city: 'Lyon',
    postalCode: '69001',
    capacity: 3,
    bedrooms: 1,
    checkIn: '15:00',
    checkOut: '11:00',
    wifiName: '',
    wifiPassword: '',
    description: 'Un loft sous les toits avec une vue dégagée sur la ville.',
    hostName: 'Thomas Bernard',
    hostPhone: '+33 6 35 42 18 70',
    hostEmail: 'thomas@toits-lyon.fr',
    coverImage:
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&h=800&fit=crop',
    status: 'draft',
    views: 0,
    completion: 58,
    updatedAt: 'Il y a 2 semaines',
  },
];
