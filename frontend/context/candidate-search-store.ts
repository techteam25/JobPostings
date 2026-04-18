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
  location: string;
  minYearsExperience: number | null;
  openToWork: boolean;

  setSkills: (skills: string[]) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  setLocation: (location: string) => void;
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
