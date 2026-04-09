"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useFiltersStore } from "@/context/store";
import {
  buildSearchParams,
  parseSearchParams,
  hasSearchParams,
} from "@/lib/search-params";

const DEBOUNCE_MS = 300;

/**
 * Bidirectional sync between Zustand filter state and URL search params.
 *
 * On mount:
 *  - If URL has search params → parse them into Zustand (URL wins).
 *  - If URL is empty but Zustand has state (from localStorage) → push to URL.
 *
 * On Zustand change:
 *  - Debounced: build URL params from state, replace URL if different.
 */
export function useSearchSync(): void {
  const hydrated = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Guard against circular updates: when we programmatically update the URL,
  // we don't want the subscription callback to trigger another URL write.
  const isUpdatingUrl = useRef(false);

  const replaceUrl = useCallback(
    (params: URLSearchParams) => {
      const search = params.toString();
      const newUrl = search ? `${pathname}?${search}` : pathname;
      isUpdatingUrl.current = true;
      router.replace(newUrl, { scroll: false });
      // Reset the guard after a tick so future external URL changes are picked up
      requestAnimationFrame(() => {
        isUpdatingUrl.current = false;
      });
    },
    [pathname, router],
  );

  // Initial hydration: URL → Zustand or Zustand → URL
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    if (hasSearchParams(searchParams)) {
      // URL has params — they win. Parse and write to Zustand.
      // Use setState directly to set values precisely (avoids remoteOnly toggle).
      const parsed = parseSearchParams(searchParams);
      useFiltersStore.setState(parsed);
    } else {
      // URL empty — if Zustand has state from localStorage, push to URL.
      const store = useFiltersStore.getState();
      const params = buildSearchParams(store);
      if (params.toString()) {
        replaceUrl(params);
      }
    }
  }, [searchParams, replaceUrl]);

  // Ongoing sync: Zustand changes → URL update (debounced)
  useEffect(() => {
    if (!hydrated.current) return;

    const debounceTimer = {
      current: null as ReturnType<typeof setTimeout> | null,
    };

    const unsubscribe = useFiltersStore.subscribe((state) => {
      if (isUpdatingUrl.current) return;

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        const params = buildSearchParams(state);
        const currentSearch = searchParams.toString();
        const newSearch = params.toString();

        if (currentSearch !== newSearch) {
          replaceUrl(params);
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchParams, replaceUrl]);
}
