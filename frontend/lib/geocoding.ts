import type { Language } from './i18n';

export interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    road?: string;
    house_number?: string;
  };
}

const NOMINATIM_BASE_URL =
  process.env.NEXT_PUBLIC_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';

const NOMINATIM_EMAIL = process.env.NEXT_PUBLIC_NOMINATIM_EMAIL;

function appendCommonParams(url: URL, language: Language) {
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', language);
  if (NOMINATIM_EMAIL) {
    url.searchParams.set('email', NOMINATIM_EMAIL);
  }
}

export async function geocodeAddress(query: string, language: Language): Promise<NominatimResult | null> {
  const url = new URL('/search', NOMINATIM_BASE_URL);
  appendCommonParams(url, language);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to geocode address');
  }

  const data = (await response.json()) as NominatimResult[];
  return data[0] || null;
}

export async function reverseGeocode(lat: number, lon: number, language: Language): Promise<NominatimResult | null> {
  const url = new URL('/reverse', NOMINATIM_BASE_URL);
  appendCommonParams(url, language);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to reverse geocode coordinates');
  }

  const data = (await response.json()) as NominatimResult;
  return data || null;
}

export function buildAddressFromNominatim(result: NominatimResult): string {
  const road = result.address?.road || '';
  const number = result.address?.house_number || '';
  const combined = [road, number].filter(Boolean).join(' ');
  if (combined) {
    return combined;
  }

  const firstSegment = result.display_name.split(',')[0]?.trim();
  return firstSegment || result.display_name;
}

export function getCityFromNominatim(result: NominatimResult): string {
  return (
    result.address?.city ||
    result.address?.town ||
    result.address?.village ||
    result.address?.county ||
    result.address?.state ||
    ''
  );
}
