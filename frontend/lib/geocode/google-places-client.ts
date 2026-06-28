import {
  buildGeocodeResultFromPlace,
  normalizeLegacyAddressComponents,
} from "./build-geocode-result";
import type { GeocodeResult, GeocodeSuggestion } from "./types";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const PLACES_BASE_URL = "https://places.googleapis.com/v1/places";
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

interface AutocompleteOptions {
  sessionToken?: string;
  proximity?: { lat: number; lng: number };
}

interface PlacePrediction {
  placeId?: string;
  text?: { text?: string };
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
}

function buildHeaders(fieldMask?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (fieldMask) {
    headers["X-Goog-FieldMask"] = fieldMask;
  }
  return headers;
}

function parseProximity(
  proximity: string | null | undefined,
): { lat: number; lng: number } | undefined {
  if (!proximity) return undefined;
  const [lngRaw, latRaw] = proximity.split(",").map((part) => part.trim());
  const lng = Number.parseFloat(lngRaw ?? "");
  const lat = Number.parseFloat(latRaw ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

function suggestionLabel(prediction: PlacePrediction): string {
  const structured = prediction.structuredFormat;
  if (structured?.mainText?.text) {
    const secondary = structured.secondaryText?.text;
    return secondary
      ? `${structured.mainText.text}, ${secondary.split(",")[0]?.trim() ?? secondary}`
      : structured.mainText.text;
  }
  return prediction.text?.text ?? "";
}

export async function autocomplete(
  apiKey: string,
  input: string,
  options: AutocompleteOptions = {},
): Promise<GeocodeSuggestion[]> {
  const body: Record<string, unknown> = {
    input,
    includedRegionCodes: ["us"],
    includedPrimaryTypes: [
      "locality",
      "administrative_area_level_1",
      "postal_code",
    ],
    languageCode: "en",
  };

  if (options.sessionToken) {
    body.sessionToken = options.sessionToken;
  }

  const proximity = options.proximity;
  if (proximity) {
    body.locationBias = {
      circle: {
        center: {
          latitude: proximity.lat,
          longitude: proximity.lng,
        },
        radius: 50_000,
      },
    };
  }

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      ...buildHeaders(
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
      ),
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    suggestions?: Array<{ placePrediction?: PlacePrediction }>;
  };

  const results: GeocodeSuggestion[] = [];
  for (const suggestion of data.suggestions ?? []) {
    const prediction = suggestion.placePrediction;
    if (!prediction?.placeId) continue;
    const label = suggestionLabel(prediction);
    if (!label) continue;
    results.push({ id: prediction.placeId, label });
  }

  return results.slice(0, 10);
}

export async function placeDetails(
  apiKey: string,
  placeId: string,
  sessionToken?: string,
): Promise<GeocodeResult | null> {
  const encodedPlaceId = encodeURIComponent(placeId);
  const url = new URL(`${PLACES_BASE_URL}/${encodedPlaceId}`);
  if (sessionToken) {
    url.searchParams.set("sessionToken", sessionToken);
  }

  const res = await fetch(url.toString(), {
    headers: {
      ...buildHeaders("id,location,addressComponents,types"),
      "X-Goog-Api-Key": apiKey,
    },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    id?: string;
    location?: { latitude?: number; longitude?: number };
    addressComponents?: Array<{
      longText?: string;
      shortText?: string;
      types?: string[];
    }>;
    types?: string[];
  };

  const lat = data.location?.latitude;
  const lng = data.location?.longitude;
  if (!data.id || lat === undefined || lng === undefined) return null;

  return buildGeocodeResultFromPlace(
    data.id,
    { latitude: lat, longitude: lng },
    data.addressComponents ?? [],
    data.types ?? [],
  );
}

export async function reverseGeocode(
  apiKey: string,
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "en");
  url.searchParams.set(
    "result_type",
    "locality|postal_code|administrative_area_level_1",
  );

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status?: string;
    results?: Array<{
      place_id?: string;
      address_components?: Array<{
        long_name?: string;
        short_name?: string;
        types?: string[];
      }>;
      geometry?: { location?: { lat?: number; lng?: number } };
      types?: string[];
    }>;
  };

  if (data.status !== "OK" || !data.results?.length) return null;

  const result = data.results[0];
  if (!result?.place_id || !result.geometry?.location) return null;

  const location = result.geometry.location;
  const resultLat = location.lat;
  const resultLng = location.lng;
  if (resultLat === undefined || resultLng === undefined) return null;

  return buildGeocodeResultFromPlace(
    result.place_id,
    { latitude: resultLat, longitude: resultLng },
    normalizeLegacyAddressComponents(result.address_components ?? []),
    result.types ?? [],
  );
}

export { parseProximity };
