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

export type DatePosted = "last-24-hours" | "last-7-days" | "last-14-days";

export type JobType =
  | "full-time"
  | "part-time"
  | "contract"
  | "volunteer"
  | "internship";

// NOTE: "volunteer" appears in both JobType and ServiceRole intentionally.
// JobType.volunteer = unpaid volunteer position type (employment classification).
// ServiceRole.volunteer = missions service role (compensation model).
// These are distinct domain concepts that happen to share a label. A future
// refactor should disambiguate the names (e.g. rename the JobType to
// "voluntary") but that requires coordinating backend enum values, Typesense
// schema, and existing persisted data.
export type ServiceRole = "paid" | "missionary" | "volunteer" | "stipend";

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

export const useApplicationStore = create<ApplicationFormState>()((...args) =>
  applicationFormSlice(...args),
);
