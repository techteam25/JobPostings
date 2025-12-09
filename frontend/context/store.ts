import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  datePostedSlice,
  jobTypeSlice,
  remoteOnlySlice,
  serviceRoleSlice,
  sortBySlice,
  savedJobsSlice,
  type SavedJobsState,
} from "./slices";

export type DatePosted = "last-24-hours" | "last-7-days" | "last-14-days";

export type JobType = "full-time" | "part-time" | "contract" | "internship";
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

export type FiltersState = RemoteOnlyFilterState &
  JobTypeFilterState &
  ServiceFiltersState &
  DatePostedFilterState &
  SortByFilterState;

export const useFiltersStore = create<FiltersState>()(
  persist(
    (...args) => ({
      ...remoteOnlySlice(...args),
      ...jobTypeSlice(...args),
      ...serviceRoleSlice(...args),
      ...datePostedSlice(...args),
      ...sortBySlice(...args),
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

export const useSavedJobsStore = create<SavedJobsState>()((...args) =>
  savedJobsSlice(...args),
);
