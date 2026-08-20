import type { OwnerProperty } from '@/lib/owner-properties';

type DatabaseProperty = Record<string, unknown>;

function time(value: unknown) {
  return typeof value === 'string' ? value.slice(0, 5) : '';
}

function formattedDate(value: unknown) {
  const date = value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
    ? value.toDate()
    : typeof value === 'string' ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
    : '';
}

export function toOwnerProperty(property: DatabaseProperty): OwnerProperty {
  const status = property.status === 'published' ? 'published' : 'draft';
  const updatedValue = property.updatedAt ?? property.updated_at;
  const updatedAt = formattedDate(updatedValue);

  return {
    id: String(property.id),
    name: String(property.name ?? ''),
    type: String(property.type ?? property.property_type ?? ''),
    address: String(property.address ?? property.address_line1 ?? ''),
    city: String(property.city ?? ''),
    postalCode: String(property.postalCode ?? property.postal_code ?? ''),
    capacity: Number(property.capacity ?? 0),
    bedrooms: Number(property.bedrooms ?? 0),
    checkIn: time(property.checkIn ?? property.check_in_time),
    checkOut: time(property.checkOut ?? property.check_out_time),
    wifiName: String(property.wifiName ?? property.wifi_name ?? ''),
    wifiPassword: String(property.wifiPassword ?? property.wifi_password ?? ''),
    description: String(property.description ?? ''),
    hostName: String(property.hostName ?? property.host_name ?? ''),
    hostAvatarUrl: String(property.hostAvatarUrl ?? property.host_avatar_url ?? ''),
    hostPhone: String(property.hostPhone ?? property.host_phone ?? ''),
    hostEmail: String(property.hostEmail ?? property.host_email ?? ''),
    coverImage: String(property.coverImage ?? property.cover_image_url ?? ''),
    status,
    views: Number(property.views ?? 0),
    completion: status === 'published' ? 100 : 0,
    createdAt: formattedDate(property.createdAt ?? property.created_at),
    updatedAt,
    arrivalInstructions: String(property.arrivalInstructions ?? property.arrival_instructions ?? ''),
    accessCode: String(property.accessCode ?? property.access_instructions ?? ''),
    parkingInstructions: String(property.parkingInstructions ?? property.parking_instructions ?? ''),
    departureInstructions: String(property.departureInstructions ?? property.departure_instructions ?? ''),
    amenities: Array.isArray(property.amenities)
      ? property.amenities.map(String).filter(Boolean)
      : [],
    equipmentGuides: Array.isArray(property.equipmentGuides)
      ? property.equipmentGuides
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({ name: String(item.name ?? ''), instructions: String(item.instructions ?? ''), imageUrl: String(item.imageUrl ?? '') }))
      : [],
    houseRules: Array.isArray(property.houseRules)
      ? property.houseRules.map(String).filter(Boolean)
      : [],
    faqItems: Array.isArray(property.faqItems)
      ? property.faqItems.map(String).filter(Boolean)
      : [],
    nearbyPlaces: Array.isArray(property.nearbyPlaces)
      ? property.nearbyPlaces
        .filter((place): place is Record<string, unknown> => Boolean(place) && typeof place === 'object')
        .map((place) => ({
          name: String(place.name ?? ''),
          category: String(place.category ?? ''),
          address: String(place.address ?? ''),
          note: String(place.note ?? ''),
        }))
      : [],
    emergencyContact: String(property.emergencyContact ?? property.emergency_contact ?? ''),
    welcomeTitle: String(property.welcomeTitle ?? property.welcome_title ?? ''),
    accentColor: String(property.accentColor ?? property.accent_color ?? '#d85b24'),
    gallery: Array.isArray(property.gallery)
      ? property.gallery.map((photo) => ({ url: String(photo && typeof photo === 'object' && 'url' in photo ? photo.url : ''), caption: String(photo && typeof photo === 'object' && 'caption' in photo ? photo.caption : '') })).filter((photo) => photo.url)
      : [],
    welcomeSubtitle: String(property.welcomeSubtitle ?? ''), hostMessage: String(property.hostMessage ?? ''), theme: property.theme === 'ocean' || property.theme === 'sage' ? property.theme : 'terra', language: property.language === 'en' ? 'en' : 'fr', showWifi: property.showWifi !== false, showMap: property.showMap !== false, showFaq: property.showFaq !== false, showGallery: property.showGallery !== false,
  };
}
