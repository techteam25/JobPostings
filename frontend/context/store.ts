import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  datePostedSlice,
  jobTypeSlice,
  remoteOnlySlice,
  searchSlice,
  serviceRoleSlice,
  sortBySlice,
  applicationFormSlice,
  type ApplicationFormState,
} from "./slices";
import {
  buildSearchParams,
  parseSearchParams,
  hasSearchParams,
} from "@/lib/search-params";

export type DatePosted = "last-24-hours" | "last-7-days" | "last-14-days";

export type JobType =
  | "full-time"
  | "part-time"
  | "contract"
  | "volunteer"
  | "internship";
type ServiceRole = "paid" | "missionary" | "volunteer" | "stipend";

export type SortBy = "relevant" | "recent";

export interface RemoteOnlyFilterState {
  remoteOnly: boolean;
  setRemoteOnly: (remote: boolean) => void;
}
export interface JobTypeFilterState {
  jobTypes: JobType[];
  setJobTypes: (types: JobType[]) => void;
}
export interface ServiceFiltersState {
  serviceRoles: ServiceRole[];
  setServiceRoles: (roles: ServiceRole[]) => void;
}
export interface DatePostedFilterState {
  datePosted: DatePosted | null;
  setDatePosted: (datePosted: DatePosted | null) => void;
}

export interface SortByFilterState {
  sortBy: SortBy;
  setSortBy: (sortBy: SortBy) => void;
}

export interface SearchState {
  keyword: string;
  location: string;
  setKeyword: (keyword: string) => void;
  setLocation: (location: string) => void;
}

export type FiltersState = RemoteOnlyFilterState &
  JobTypeFilterState &
  ServiceFiltersState &
  DatePostedFilterState &
  SortByFilterState &
  SearchState;

export const useFiltersStore = create<FiltersState>()(
  persist(
    (...args) => ({
      ...remoteOnlySlice(...args),
      ...jobTypeSlice(...args),
      ...serviceRoleSlice(...args),
      ...datePostedSlice(...args),
      ...sortBySlice(...args),
      ...searchSlice(...args),
    }),
    {
      name: "filters-storage",
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

// Bidirectional sync: Zustand ↔ URL search params via window.history.replaceState.
// Runs at module level — no React hooks or useEffect needed.
if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);
  const urlHasSearchParams = hasSearchParams(urlParams);

  const initUrlSync = () => {
    // Hydration: URL wins over localStorage; otherwise push localStorage to URL
    if (urlHasSearchParams) {
      useFiltersStore.setState(parseSearchParams(urlParams));
    } else {
      const params = buildSearchParams(useFiltersStore.getState());
      const search = params.toString();
      if (search) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${search}`,
        );
      }
    }

    // Ongoing sync: store changes → URL (debounced 300ms)
    let timer: ReturnType<typeof setTimeout> | null = null;
    useFiltersStore.subscribe((state) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const params = buildSearchParams(state);
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
  };

  if (useFiltersStore.persist.hasHydrated()) {
    initUrlSync();
  } else {
    useFiltersStore.persist.onFinishHydration(initUrlSync);
  }
}

export const useApplicationStore = create<ApplicationFormState>()((...args) =>
  applicationFormSlice(...args),
);
