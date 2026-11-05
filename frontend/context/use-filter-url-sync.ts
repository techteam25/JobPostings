"use client";

import { useEffect } from "react";

import { useFiltersStore } from "@/context/store";
import {
  buildSearchParams,
  hasSearchParams,
  parseSearchParams,
} from "@/lib/search-params";

/**
 * Mirrors the filter Zustand slice to `window.location.search`, scoped to the
 * component that owns the filter UI. Mount exactly one instance per route
 * that exposes the filters — currently `SearchPageContent`.
 *
 * The listener lifetime is tied to the component's lifetime, so the sync
 * never fires while a non-filter route is mounted.
 */
export function useFilterUrlSync() {
  useEffect(() => {
    const writeStoreToUrl = () => {
      const next = buildSearchParams(useFiltersStore.getState()).toString();
      const current = new URLSearchParams(window.location.search).toString();
      if (current === next) return;
      const url = next
        ? `${window.location.pathname}?${next}`
        : window.location.pathname;
      window.history.replaceState(null, "", url);
    };

    const readUrlToStore = () => {
      const params = new URLSearchParams(window.location.search);
      if (hasSearchParams(params)) {
        useFiltersStore.setState(parseSearchParams(params));
      }
    };

    const attach = () => {
      // Hydration: URL wins over persisted store; otherwise push store to URL.
      const urlParams = new URLSearchParams(window.location.search);
      if (hasSearchParams(urlParams)) {
        useFiltersStore.setState(parseSearchParams(urlParams));
      } else {
        writeStoreToUrl();
      }

      const unsubscribe = useFiltersStore.subscribe(writeStoreToUrl);
      window.addEventListener("popstate", readUrlToStore);

      return () => {
        unsubscribe();
        window.removeEventListener("popstate", readUrlToStore);
      };
    };

    let detach: (() => void) | undefined;

    if (useFiltersStore.persist.hasHydrated()) {
      detach = attach();
    } else {
      const unsubHydration = useFiltersStore.persist.onFinishHydration(() => {
        detach = attach();
      });
      return () => {
        unsubHydration();
        detach?.();
      };
    }

    return () => {
      detach?.();
    };
  }, []);
}
