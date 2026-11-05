import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import {
  autocomplete,
  parseProximity,
  placeDetails,
  reverseGeocode,
  type GeocodeSuggestion,
} from "@/lib/geocode";

export type { GeocodeResult, GeocodeSuggestion } from "@/lib/geocode";

const CACHE_TTL_MS = 60_000;
const MAX_CACHE_SIZE = 128;
const cache = new Map<
  string,
  { value: GeocodeSuggestion[]; expiresAt: number }
>();

function autocompleteCacheKey(q: string, proximity: string | null): string {
  const normalizedQuery = q.toLowerCase();
  const parsed = parseProximity(proximity);
  if (!parsed) return normalizedQuery;
  // ~1.1 km buckets — close enough to share cache, far enough to preserve bias.
  const latBucket = parsed.lat.toFixed(2);
  const lngBucket = parsed.lng.toFixed(2);
  return `${normalizedQuery}|${lngBucket},${latBucket}`;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const placeId = params.get("placeId")?.trim();
  const sessionToken = params.get("sessionToken")?.trim() || undefined;
  const latRaw = params.get("lat");
  const lngRaw = params.get("lng");

  if (placeId) {
    const apiKey = env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(null, { status: 503 });
    }
    const result = await placeDetails(apiKey, placeId, sessionToken);
    if (!result) {
      return NextResponse.json(null, { status: 502 });
    }
    return NextResponse.json(result);
  }

  if (latRaw && lngRaw) {
    const apiKey = env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(null, { status: 503 });
    }
    const lat = Number.parseFloat(latRaw);
    const lng = Number.parseFloat(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(null, { status: 400 });
    }
    const result = await reverseGeocode(apiKey, lat, lng);
    if (!result) {
      return NextResponse.json(null, { status: 502 });
    }
    return NextResponse.json(result);
  }

  const q = params.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json([]);
  }

  const proximityParam = params.get("proximity");
  const cacheKey = autocompleteCacheKey(q, proximityParam);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value);
  }

  const proximity = parseProximity(proximityParam);
  const results = await autocomplete(apiKey, q, {
    sessionToken,
    proximity,
  });

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
