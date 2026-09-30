import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ImportedAddress = { address: string; city: string; postalCode: string };

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? decodeHtml(match[2]) : '';
}

function metaContent(html: string, keys: string[]) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const key = attribute(tag, 'property').toLowerCase() || attribute(tag, 'name').toLowerCase();
    if (keys.includes(key)) return attribute(tag, 'content');
  }
  return '';
}

function jsonLdEntries(html: string) {
  const scripts = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const entries: Record<string, unknown>[] = [];
  for (const script of scripts) {
    try {
      const value = JSON.parse(script[1].trim()) as unknown;
      const values = Array.isArray(value) ? value : [value];
      values.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        entries.push(record);
        if (Array.isArray(record['@graph'])) {
          record['@graph'].forEach((graphItem) => {
            if (graphItem && typeof graphItem === 'object') entries.push(graphItem as Record<string, unknown>);
          });
        }
      });
    } catch {
      // A malformed metadata block should not prevent the valid metadata from importing.
    }
  }
  return entries;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? decodeHtml(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
}

function imageValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(imageValues);
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>;
    return [item.url, item.contentUrl].flatMap(imageValues);
  }
  return [];
}

function amenityValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (item && typeof item === 'object') return [stringValue((item as Record<string, unknown>).name)];
    return [];
  });
}

function normalizeAddress(value: unknown): ImportedAddress {
  if (!value || typeof value !== 'object') return { address: '', city: '', postalCode: '' };
  const address = value as Record<string, unknown>;
  return {
    address: stringValue(address.streetAddress),
    city: stringValue(address.addressLocality),
    postalCode: stringValue(address.postalCode),
  };
}

function allowedSource(url: URL) {
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
  return new Set([
    'airbnb.com', 'www.airbnb.com', 'airbnb.fr', 'www.airbnb.fr',
    'maps.app.goo.gl', 'goo.gl', 'maps.google.com', 'www.google.com',
    'maps.google.fr', 'www.google.fr',
  ]).has(url.hostname.toLowerCase());
}

async function fetchSource(source: URL) {
  let current = source;
  const signal = AbortSignal.timeout(8000);
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (!allowedSource(current)) throw new Error('invalid-source');
    const response = await fetch(current, {
      redirect: 'manual', signal,
      headers: { 'User-Agent': 'MonLivret-importer/1.0' },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get('location');
      if (!location) throw new Error('invalid-redirect');
      current = new URL(location, current);
      continue;
    }
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new Error('unavailable');
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 1_500_000) throw new Error('too-large');
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    return { html: Buffer.concat(chunks).toString('utf8'), finalUrl: current };
  }
  throw new Error('too-many-redirects');
}

function safeImageUrl(value: string, base: string) {
  try {
    const url = new URL(value, base);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function isGoogleMapsUrl(url: URL) {
  const host = url.hostname.toLowerCase();
  return host === 'maps.app.goo.gl'
    || host === 'goo.gl'
    || host.startsWith('maps.google.')
    || host.startsWith('www.google.');
}

function googleMapsQuery(url: URL) {
  const fromParameter = url.searchParams.get('q')
    || url.searchParams.get('query')
    || url.searchParams.get('destination');
  if (fromParameter) return fromParameter;
  const placeMatch = decodeURIComponent(url.pathname).match(/\/maps\/place\/([^/]+)/i);
  return placeMatch ? placeMatch[1].replace(/\+/g, ' ').trim() : '';
}

async function geocodeFrenchAddress(query: string): Promise<ImportedAddress> {
  if (!query.trim()) return { address: '', city: '', postalCode: '' };
  try {
    const response = await fetch(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(query)}&limit=1&index=address`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { address: '', city: '', postalCode: '' };
    const data = await response.json() as { features?: Array<{ properties?: Record<string, unknown> }> };
    const details = data.features?.[0]?.properties ?? {};
    const street = stringValue(details.name);
    const number = stringValue(details.housenumber);
    return {
      address: `${number ? `${number} ` : ''}${street}`.trim(),
      city: stringValue(details.city),
      postalCode: stringValue(details.postcode),
    };
  } catch {
    return { address: '', city: '', postalCode: '' };
  }
}

export async function POST(request: Request) {
  let submittedUrl = '';
  try {
    const body = await request.json() as { url?: unknown };
    submittedUrl = typeof body.url === 'string' ? body.url.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Le lien fourni est invalide.' }, { status: 400 });
  }

  let source: URL;
  try {
    source = new URL(submittedUrl);
  } catch {
    return NextResponse.json({ error: 'Ajoutez un lien Airbnb ou Google Maps valide.' }, { status: 400 });
  }
  if (!allowedSource(source)) {
    return NextResponse.json({ error: 'Utilisez uniquement un lien Airbnb ou Google Maps public.' }, { status: 400 });
  }

  try {
    const { html, finalUrl } = await fetchSource(source);
    const entries = jsonLdEntries(html);
    const primary = entries.find((item) => stringValue(item.name) || stringValue(item.description)) ?? {};
    const structuredAddress = normalizeAddress(primary.address);
    const mapsQuery = isGoogleMapsUrl(finalUrl) ? googleMapsQuery(finalUrl) : '';
    const geocodedAddress = structuredAddress.address ? { address: '', city: '', postalCode: '' } : await geocodeFrenchAddress(mapsQuery);
    const address = {
      address: structuredAddress.address || geocodedAddress.address,
      city: structuredAddress.city || geocodedAddress.city,
      postalCode: structuredAddress.postalCode || geocodedAddress.postalCode,
    };
    const images = [
      metaContent(html, ['og:image', 'twitter:image']),
      ...entries.flatMap((item) => imageValues(item.image)),
    ].map((image) => safeImageUrl(image, finalUrl.toString())).filter(Boolean);
    const amenities = [...new Set(entries.flatMap((item) => [
      ...amenityValues(item.amenityFeature),
      ...amenityValues(item.amenities),
    ]).map(stringValue).filter(Boolean))].slice(0, 16);
    const rawType = primary['@type'];
    const type = Array.isArray(rawType) ? rawType[0] : rawType;

    const metadataTitle = metaContent(html, ['og:title', 'twitter:title']) || stringValue(primary.name);
    return NextResponse.json({
      name: metadataTitle.replace(/\s*[—|-]\s*Google Maps$/i, '').trim(),
      description: metaContent(html, ['og:description', 'twitter:description', 'description']) || stringValue(primary.description),
      coverImage: images[0] ?? '',
      gallery: [...new Set(images)].slice(0, 6),
      amenities,
      address,
      type: stringValue(type),
      sourceUrl: finalUrl.toString(),
    });
  } catch {
    return NextResponse.json({ error: 'Impossible de lire ce lien pour le moment. Vérifiez qu’il est public, puis réessayez.' }, { status: 422 });
  }
}
