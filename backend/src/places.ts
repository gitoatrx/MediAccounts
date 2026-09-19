// Google Places proxy. The API key stays on the server; the app only talks to
// MediAccounts. Uses Places API (New) and falls back to the classic Places API
// when the key's project has only the classic API enabled.
// Session tokens group autocomplete + details into one billed session.

export class PlacesError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

type AddressComponent = { longText?: string; shortText?: string; types?: string[] };
type Suggestion = { placeId: string; primary: string; secondary: string };

// GOOGLE_PLACES_API: "new", "legacy", or "auto" (default: try New, then remember a fallback).
let useLegacy = (process.env.GOOGLE_PLACES_API ?? 'auto').trim().toLowerCase() === 'legacy';

function apiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) throw new PlacesError('Address search is not set up yet. Add GOOGLE_MAPS_API_KEY on the server.', 503);
  return key;
}

function regions() {
  return (process.env.GOOGLE_PLACES_REGIONS ?? 'ca').split(',').map((code) => code.trim().toLowerCase()).filter(Boolean);
}

class NewApiUnavailable extends Error {}

async function callNew<T>(url: string, init: RequestInit & { fieldMask: string }) {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey(), 'X-Goog-FieldMask': init.fieldMask },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: { message?: string; status?: string } };
  if (!response.ok) {
    const message = body.error?.message ?? '';
    const canFallBack = (process.env.GOOGLE_PLACES_API ?? 'auto').trim().toLowerCase() !== 'new'
      && (body.error?.status === 'PERMISSION_DENIED' || /has not been used|is disabled|not enabled/i.test(message));
    if (canFallBack) throw new NewApiUnavailable(message);
    console.error('[MediAccounts places] Google Places error:', message || response.status);
    throw new PlacesError(message || 'Address search is unavailable right now.', 502);
  }
  return body;
}

async function callLegacy<T extends { status?: string; error_message?: string }>(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams({ key: apiKey() });
  Object.entries(params).forEach(([name, value]) => { if (value) query.set(name, value); });
  const response = await fetch(`https://maps.googleapis.com/maps/api/place/${path}/json?${query}`);
  const body = (await response.json().catch(() => ({}))) as T;
  if (!response.ok || (body.status !== 'OK' && body.status !== 'ZERO_RESULTS')) {
    console.error('[MediAccounts places] Google Places (classic) error:', body.status, body.error_message ?? '');
    throw new PlacesError(body.error_message ?? 'Address search is unavailable right now.', 502);
  }
  return body;
}

/** Runs the Places API (New) call, switching to the classic API for good if New is not enabled. */
async function withFallback<R>(runNew: () => Promise<R>, runLegacy: () => Promise<R>) {
  if (useLegacy) return runLegacy();
  try {
    return await runNew();
  } catch (error) {
    if (!(error instanceof NewApiUnavailable)) throw error;
    console.warn('[MediAccounts places] Places API (New) is not enabled for this key; using the classic Places API.');
    useLegacy = true;
    return runLegacy();
  }
}

export async function autocompleteAddress(input: string, sessionToken?: string): Promise<Suggestion[]> {
  const codes = regions();
  return withFallback(
    async () => {
      const body = await callNew<{ suggestions?: Array<{ placePrediction?: { placeId: string; text?: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }> }>(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          fieldMask: 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
          body: JSON.stringify({ input, sessionToken, includedRegionCodes: codes.length ? codes : undefined }),
        },
      );
      return (body.suggestions ?? [])
        .map((item) => item.placePrediction)
        .filter((prediction): prediction is NonNullable<typeof prediction> => !!prediction?.placeId)
        .map((prediction) => ({
          placeId: prediction.placeId,
          primary: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? '',
          secondary: prediction.structuredFormat?.secondaryText?.text ?? '',
        }));
    },
    async () => {
      const body = await callLegacy<{ status?: string; error_message?: string; predictions?: Array<{ place_id: string; description?: string; structured_formatting?: { main_text?: string; secondary_text?: string } }> }>(
        'autocomplete',
        { input, sessiontoken: sessionToken, components: codes.length ? codes.map((code) => `country:${code}`).join('|') : undefined },
      );
      return (body.predictions ?? []).map((prediction) => ({
        placeId: prediction.place_id,
        primary: prediction.structured_formatting?.main_text ?? prediction.description ?? '',
        secondary: prediction.structured_formatting?.secondary_text ?? '',
      }));
    },
  );
}

function toAddress(components: AddressComponent[], formattedAddress: string) {
  const find = (type: string, short = false) => {
    const component = components.find((item) => item.types?.includes(type));
    return (short ? component?.shortText : component?.longText) ?? '';
  };
  const street = [find('street_number'), find('route')].filter(Boolean).join(' ');
  return {
    businessAddress: street || formattedAddress.split(',')[0] || '',
    addressLine2: find('subpremise'),
    city: find('locality') || find('postal_town') || find('sublocality') || find('administrative_area_level_2'),
    province: find('administrative_area_level_1', true),
    postalCode: find('postal_code'),
    country: find('country', true),
    formattedAddress,
  };
}

export async function addressDetails(placeId: string, sessionToken?: string) {
  return withFallback(
    async () => {
      const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
      const body = await callNew<{ formattedAddress?: string; addressComponents?: AddressComponent[] }>(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}${query}`,
        { method: 'GET', fieldMask: 'formattedAddress,addressComponents' },
      );
      return toAddress(body.addressComponents ?? [], body.formattedAddress ?? '');
    },
    async () => {
      const body = await callLegacy<{ status?: string; error_message?: string; result?: { formatted_address?: string; address_components?: Array<{ long_name?: string; short_name?: string; types?: string[] }> } }>(
        'details',
        { place_id: placeId, sessiontoken: sessionToken, fields: 'address_component,formatted_address' },
      );
      const components = (body.result?.address_components ?? []).map((item) => ({ longText: item.long_name, shortText: item.short_name, types: item.types }));
      return toAddress(components, body.result?.formatted_address ?? '');
    },
  );
}
