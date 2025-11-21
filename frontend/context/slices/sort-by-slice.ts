import { StateCreator } from "zustand";
import { SortByFilterState, FiltersState } from "../store";

export const sortBySlice: StateCreator<
  FiltersState,
  [],
  [],
  SortByFilterState
> = (set) => ({
  sortBy: "recent",
  setSortBy: (sortBy) => set(() => ({ sortBy })),
});
