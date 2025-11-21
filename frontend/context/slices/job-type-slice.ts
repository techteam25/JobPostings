import { StateCreator } from "zustand";
import { FiltersState, JobTypeFilterState } from "../store";

export const jobTypeSlice: StateCreator<
  FiltersState,
  [],
  [],
  JobTypeFilterState
> = (set) => ({
  jobTypes: [],
  setJobTypes: (types) => set(() => ({ jobTypes: types })),
});
