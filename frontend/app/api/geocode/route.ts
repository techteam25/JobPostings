import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";

export interface GeocodeResult {
  id: string;
  /** Short label for display in the dropdown and input (e.g. "Austin, TX"). */
  label: string;
  /**
   * Full-form label that tokenizes cleanly against the backend's
   * Typesense-indexed `location` field
   * ("City, FullStateName, United States", see
   * `backend/src/modules/user-profile/helpers/build-candidate-search-document.ts`).
   * Candidate search should filter on this value, not `label`.
   */
  filterValue: string;
  city?: string;
  /** Full state name, e.g. "Texas". */
  state?: string;
  /** USPS state abbreviation, e.g. "TX". */
  stateCode?: string;
  zip?: string;
  lat: number;
  lng: number;
}

interface MapboxContext {
  id?: string;
  text?: string;
  short_code?: string;
}

interface MapboxFeature {
  id?: string;
  text?: string;
  place_name?: string;
  center?: [number, number];
  context?: MapboxContext[];
}

const CACHE_TTL_MS = 60_000;
const MAX_CACHE_SIZE = 128;
const cache = new Map<string, { value: GeocodeResult[]; expiresAt: number }>();

// The backend Typesense `location` field is built from a profile's raw
// `city, state, country` columns (see
// `backend/src/modules/user-profile/helpers/build-candidate-search-document.ts`),
// where `country` defaults to "United States" and `state` is the full state
// name like "Texas" (not "TX"). For candidate-search filters to actually
// match, the *filter* value we emit must tokenize against those indexed
// values — so we emit a separate `filterValue` with the full state name and
// ", United States" suffix while keeping the display `label` short and
// Indeed-style (e.g. "Austin, TX").
const COUNTRY_LABEL = "United States";

function buildShortLabel(
  feature: MapboxFeature,
  stateCode: string | undefined,
): string {
  const primary = feature.text ?? "";
  if (!primary) return feature.place_name ?? "";
  if (!stateCode) return primary;
  return `${primary}, ${stateCode}`;
}

function buildFilterValue(
  feature: MapboxFeature,
  state: string | undefined,
): string {
  // Postcode suggestions can't match the indexed `location` field (which
  // never contains a zip), so we emit an empty filter value and let the
  // caller drive the filter with the separate `zip` meta instead.
  if (feature.id?.startsWith("postcode")) return "";

  const primary = feature.text ?? "";
  if (!primary) return feature.place_name ?? "";
  if (!state) return primary;
  return `${primary}, ${state}, ${COUNTRY_LABEL}`;
}

function parseFeature(feature: MapboxFeature): GeocodeResult | null {
  if (!feature.id || !feature.center) return null;
  const context = feature.context ?? [];
  const region = context.find((c) => c.id?.startsWith("region"));
  const postcode = context.find((c) => c.id?.startsWith("postcode"));

  let city: string | undefined;
  let zip: string | undefined;
  if (feature.id.startsWith("place")) city = feature.text;
  if (feature.id.startsWith("postcode")) zip = feature.text;
  if (!zip && postcode?.text) zip = postcode.text;

  // Full state name — `region.text` is "Texas", `region.short_code` is
  // "us-tx". The backend indexes the full name (used for `filterValue`),
  // while the UI prefers the USPS abbreviation (used for `label`).
  const state = region?.text;
  const stateCode = region?.short_code
    ? region.short_code.replace(/^us-/i, "").toUpperCase()
    : undefined;

  const [lng, lat] = feature.center;

  return {
    id: feature.id,
    label: buildShortLabel(feature, stateCode),
    filterValue: buildFilterValue(feature, state),
    city,
    state,
    stateCode,
    zip,
    lat,
    lng,
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const token = env.MAPBOX_TOKEN;
  if (!token) return NextResponse.json([]);

  const cacheKey = q.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value);
  }

  const endpoint = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`,
  );
  endpoint.searchParams.set("access_token", token);
  endpoint.searchParams.set("types", "place,postcode,region");
  endpoint.searchParams.set("country", "us");
  endpoint.searchParams.set("autocomplete", "true");
  endpoint.searchParams.set("limit", "10");

  const proximity = req.nextUrl.searchParams.get("proximity");
  if (proximity) endpoint.searchParams.set("proximity", proximity);

  const res = await fetch(endpoint.toString());
  if (!res.ok) {
    return NextResponse.json([], { status: 502 });
  }

  const data = (await res.json()) as { features?: MapboxFeature[] };
  const results = (data.features ?? [])
    .map(parseFeature)
    .filter((r): r is GeocodeResult => r !== null);

  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(cacheKey, {
    value: results,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return NextResponse.json(results);
}
