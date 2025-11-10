import { StateCreator } from "zustand";
import { DatePostedFilterState, FiltersState } from "../store";

export const datePostedSlice: StateCreator<
  FiltersState,
  [],
  [],
  DatePostedFilterState
> = (set) => ({
  datePosted: null,
  setDatePosted: (datePosted) => set(() => ({ datePosted })),
});
