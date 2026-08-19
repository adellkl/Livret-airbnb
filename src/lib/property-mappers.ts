import type { OwnerProperty } from '@/lib/owner-properties';

type DatabaseProperty = Record<string, unknown>;

function time(value: unknown) {
  return typeof value === 'string' ? value.slice(0, 5) : '';
}

export function toOwnerProperty(property: DatabaseProperty): OwnerProperty {
  const status = property.status === 'published' ? 'published' : 'draft';
  const updatedAt = typeof property.updated_at === 'string'
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(property.updated_at))
    : '';

  return {
    id: String(property.id),
    name: String(property.name ?? ''),
    type: String(property.property_type ?? ''),
    address: String(property.address_line1 ?? ''),
    city: String(property.city ?? ''),
    postalCode: String(property.postal_code ?? ''),
    capacity: Number(property.capacity ?? 0),
    bedrooms: Number(property.bedrooms ?? 0),
    checkIn: time(property.check_in_time),
    checkOut: time(property.check_out_time),
    wifiName: String(property.wifi_name ?? ''),
    wifiPassword: String(property.wifi_password ?? ''),
    description: String(property.description ?? ''),
    hostName: String(property.host_name ?? ''),
    hostPhone: String(property.host_phone ?? ''),
    hostEmail: String(property.host_email ?? ''),
    coverImage: String(property.cover_image_url ?? ''),
    status,
    views: 0,
    completion: status === 'published' ? 100 : 0,
    updatedAt,
    arrivalInstructions: String(property.arrival_instructions ?? ''),
    accessCode: String(property.access_instructions ?? ''),
    parkingInstructions: String(property.parking_instructions ?? ''),
    departureInstructions: String(property.departure_instructions ?? ''),
    emergencyContact: String(property.emergency_contact ?? ''),
    welcomeTitle: String(property.welcome_title ?? ''),
    accentColor: String(property.accent_color ?? '#d85b24'),
  };
}
