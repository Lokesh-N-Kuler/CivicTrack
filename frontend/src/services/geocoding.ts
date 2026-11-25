// Geocoding and Reverse-Geocoding Service for CivicTrack (Bengaluru)
// Connects to OpenStreetMap Nominatim with local boundary validation,
// debouncing, locality extraction, and offline fallback resiliency.

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  locality: string;
  latitude: number;
  longitude: number;
  isWithinBengaluru: boolean;
}

export const BENGALURU_CONFIG = {
  center: { lat: 12.9716, lng: 77.5946 },
  zoom: {
    city: 12,
    street: 16,
    default: 13,
  },
  bounds: {
    minLat: 12.75,
    maxLat: 13.25,
    minLng: 77.40,
    maxLng: 77.85,
  },
  // Nominatim viewbox parameter: left,top,right,bottom (minLng, maxLat, maxLng, minLat)
  viewbox: '77.40,13.25,77.85,12.75',
};

// Popular curated Bengaluru localities for instant match & fallback resilience
const POPULAR_BENGALURU_LOCALITIES = [
  { name: 'Indiranagar, Bengaluru', locality: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: '100 Feet Road, Indiranagar, Bengaluru', locality: 'Indiranagar', lat: 12.9750, lng: 77.6400 },
  { name: '12th Main Road, Indiranagar, Bengaluru', locality: 'Indiranagar', lat: 12.9690, lng: 77.6402 },
  { name: 'Koramangala, Bengaluru', locality: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: '80 Feet Road, 4th Block, Koramangala, Bengaluru', locality: 'Koramangala', lat: 12.9340, lng: 77.6260 },
  { name: 'Whitefield, Bengaluru', locality: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'ITPL Main Road, Whitefield, Bengaluru', locality: 'Whitefield', lat: 12.9860, lng: 77.7370 },
  { name: 'HSR Layout, Bengaluru', locality: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
  { name: '27th Main Road, Sector 1, HSR Layout, Bengaluru', locality: 'HSR Layout', lat: 12.9110, lng: 77.6450 },
  { name: 'Malleshwaram, Bengaluru', locality: 'Malleshwaram', lat: 13.0031, lng: 77.5643 },
  { name: 'Sampige Road, Malleshwaram, Bengaluru', locality: 'Malleshwaram', lat: 13.0010, lng: 77.5700 },
  { name: 'Jayanagar, Bengaluru', locality: 'Jayanagar', lat: 12.9308, lng: 77.5838 },
  { name: '4th Block, Jayanagar, Bengaluru', locality: 'Jayanagar', lat: 12.9290, lng: 77.5825 },
  { name: 'Hebbal, Bengaluru', locality: 'Hebbal', lat: 13.0358, lng: 77.5970 },
  { name: 'Bellary Road, Hebbal, Bengaluru', locality: 'Hebbal', lat: 13.0380, lng: 77.5920 },
  { name: 'Hebbal Cholanagar, Bengaluru', locality: 'Hebbal', lat: 13.0320, lng: 77.5910 },
  { name: 'MG Road, Central Bengaluru', locality: 'Central Bengaluru', lat: 12.9756, lng: 77.6066 },
  { name: 'Brigade Road, Central Bengaluru', locality: 'Central Bengaluru', lat: 12.9715, lng: 77.6070 },
  { name: 'BTM Layout, Bengaluru', locality: 'BTM Layout', lat: 12.9166, lng: 77.6101 },
  { name: 'Electronic City Phase 1, Bengaluru', locality: 'Electronic City', lat: 12.8452, lng: 77.6602 },
  { name: 'Marathahalli, Bengaluru', locality: 'Marathahalli', lat: 12.9591, lng: 77.6974 },
  { name: 'Rajajinagar, Bengaluru', locality: 'Rajajinagar', lat: 12.9982, lng: 77.5530 },
  { name: 'Banashankari, Bengaluru', locality: 'Banashankari', lat: 12.9255, lng: 77.5468 },
  { name: 'Yelahanka, Bengaluru', locality: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
  { name: 'Shivajinagar, Bengaluru', locality: 'Shivajinagar', lat: 12.9857, lng: 77.6057 },
];

/**
 * Checks if coordinate lies inside greater Bengaluru municipal service boundary
 */
export function isInsideBengaluru(lat: number, lng: number): boolean {
  return (
    lat >= BENGALURU_CONFIG.bounds.minLat &&
    lat <= BENGALURU_CONFIG.bounds.maxLat &&
    lng >= BENGALURU_CONFIG.bounds.minLng &&
    lng <= BENGALURU_CONFIG.bounds.maxLng
  );
}

/**
 * Extract clean locality from Nominatim address object
 */
export function extractLocality(addressObj: any, fallbackName: string = ''): string {
  if (!addressObj) {
    // Attempt parsing from name
    const parts = fallbackName.split(',');
    return parts[0]?.trim() || 'Bengaluru';
  }

  const locality =
    addressObj.suburb ||
    addressObj.neighbourhood ||
    addressObj.quarter ||
    addressObj.residential ||
    addressObj.city_district ||
    addressObj.road ||
    addressObj.city ||
    addressObj.town ||
    addressObj.village ||
    'Bengaluru';

  return String(locality).trim();
}

/**
 * Search locations with Nominatim forward geocoding with Bengaluru bias.
 */
export async function searchLocations(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  // Prepend or append Bengaluru context if not specified by user
  const hasBengaluru = /bengaluru|bangalore/i.test(trimmed);
  const searchString = hasBengaluru ? trimmed : `${trimmed}, Bengaluru, Karnataka`;

  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
  nominatimUrl.searchParams.set('format', 'json');
  nominatimUrl.searchParams.set('addressdetails', '1');
  nominatimUrl.searchParams.set('limit', '6');
  nominatimUrl.searchParams.set('countrycodes', 'in');
  nominatimUrl.searchParams.set('viewbox', BENGALURU_CONFIG.viewbox);
  nominatimUrl.searchParams.set('bounded', '0'); // Prefer within viewbox but don't strictly forbid
  nominatimUrl.searchParams.set('q', searchString);

  try {
    const res = await fetch(nominatimUrl.toString(), {
      signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const locality = extractLocality(item.address, item.display_name);
          return {
            placeId: String(item.place_id || `${lat}_${lng}`),
            displayName: item.display_name,
            locality,
            latitude: lat,
            longitude: lng,
            isWithinBengaluru: isInsideBengaluru(lat, lng),
          };
        });
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    // Network or rate limit fallback - fall through to curated matching
    console.warn('Nominatim geocode network fetch failed; falling back to curated index:', err);
  }

  // Fallback: match local curated Bengaluru localities
  const lower = trimmed.toLowerCase();
  const matched = POPULAR_BENGALURU_LOCALITIES.filter((loc) =>
    loc.name.toLowerCase().includes(lower) || loc.locality.toLowerCase().includes(lower)
  );

  return matched.slice(0, 5).map((loc, idx) => ({
    placeId: `curated_${idx}_${loc.lat}`,
    displayName: loc.name,
    locality: loc.locality,
    latitude: loc.lat,
    longitude: loc.lng,
    isWithinBengaluru: true,
  }));
}

/**
 * Reverse geocode coordinates to readable address and locality.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<{ address: string; locality: string; placeId?: string }> {
  const isInside = isInsideBengaluru(lat, lng);

  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse');
  nominatimUrl.searchParams.set('format', 'json');
  nominatimUrl.searchParams.set('lat', lat.toString());
  nominatimUrl.searchParams.set('lon', lng.toString());
  nominatimUrl.searchParams.set('addressdetails', '1');

  try {
    const res = await fetch(nominatimUrl.toString(), {
      signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const locality = extractLocality(data.address, data.display_name);
        return {
          address: data.display_name,
          locality,
          placeId: String(data.place_id || ''),
        };
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.warn('Nominatim reverse geocode failed:', err);
  }

  // Graceful fallback
  const approxLocality = isInside ? 'Bengaluru' : 'Outside Bengaluru Municipal Bounds';
  return {
    address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}${isInside ? ', Bengaluru, Karnataka, India' : ''}`,
    locality: approxLocality,
  };
}

