import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { candidateSearchFiltersSlice } from "./slices/candidate-search-slice";
import {
  buildCandidateSearchParams,
  parseCandidateSearchParams,
  hasCandidateSearchParams,
} from "@/lib/candidate-search-params";

export interface CandidateSearchFiltersState {
  skills: string[];
  /**
   * Short, user-facing location string shown in the input (e.g.
   * "Austin, TX"). Also kept in the URL for shareable links.
   */
  location: string;
  /**
   * Canonical, backend-matchable location string that tokenizes cleanly
   * against the Typesense-indexed `location` field (e.g. "Austin, Texas,
   * United States"). When a user picks an autocomplete suggestion, this
   * diverges from `location`. When they type free-form, it equals
   * `location`. Empty when a pure-zipcode suggestion was picked (the
   * indexed `location` can't match a zip, so we leave the location filter
   * unset and rely on `locationZipcode` alone).
   */
  locationFilter: string;
  /**
   * Zip/postal code filter. Set when the user picks a zipcode
   * autocomplete suggestion (the indexed candidate `location` never
   * includes zip codes — the backend matches this via a separate
   * `zipCode` Typesense field, see migration `0006_add-zipcode-to-profiles`).
   */
  locationZipcode: string;
  minYearsExperience: number | null;
  openToWork: boolean;

  setSkills: (skills: string[]) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  /**
   * Set the display value, the tokenized location filter, and the zipcode
   * filter in a single update. Pass `filterValue` and `zipcode` to decouple
   * them when a suggestion is picked; omit them for raw free-form input
   * (filter falls back to the display, zipcode is cleared).
   */
  setLocation: (
    location: string,
    filterValue?: string,
    zipcode?: string,
  ) => void;
  setMinYearsExperience: (minYearsExperience: number | null) => void;
  setOpenToWork: (openToWork: boolean) => void;
  clearFilters: () => void;
}

// `skipHydration: true` prevents Zustand from rehydrating synchronously at
// module-evaluation time. That would cause the first client render to diverge
// from SSR (the server has no localStorage, so it uses defaults). Instead, we
// rehydrate manually in `useCandidateSearchStoreHydration` inside a client
// `useEffect`, which guarantees the first client render matches SSR and the
// persisted state is applied after mount.
export const useCandidateSearchStore = create<CandidateSearchFiltersState>()(
  persist(
    (...args) => ({
      ...candidateSearchFiltersSlice(...args),
    }),
    {
      name: "candidate-search-storage",
      skipHydration: true,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
    },
  ),
);

let urlSyncInitialized = false;

function initUrlSync() {
  if (urlSyncInitialized || typeof window === "undefined") return;
  urlSyncInitialized = true;

  const urlParams = new URLSearchParams(window.location.search);
  if (hasCandidateSearchParams(urlParams)) {
    useCandidateSearchStore.setState(parseCandidateSearchParams(urlParams));
  } else {
    const params = buildCandidateSearchParams(
      useCandidateSearchStore.getState(),
    );
    const search = params.toString();
    if (search) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${search}`,
      );
    }
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  useCandidateSearchStore.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const params = buildCandidateSearchParams(
        useCandidateSearchStore.getState(),
      );
      const newSearch = params.toString();
      const currentSearch = new URLSearchParams(
        window.location.search,
      ).toString();
      if (currentSearch !== newSearch) {
        const url = newSearch
          ? `${window.location.pathname}?${newSearch}`
          : window.location.pathname;
        window.history.replaceState(null, "", url);
      }
    }, 300);
  });

  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    if (hasCandidateSearchParams(params)) {
      useCandidateSearchStore.setState(parseCandidateSearchParams(params));
    }
  });
}

/**
 * Returns `true` after the persisted store has been rehydrated from
 * localStorage and URL sync has been wired up. Components that render
 * differently based on persisted filter state must gate on this to avoid
 * SSR/client hydration mismatches.
 */
export function useCandidateSearchStoreHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void useCandidateSearchStore.persist.rehydrate()?.then(() => {
      if (cancelled) return;
      initUrlSync();
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return hydrated;
}
