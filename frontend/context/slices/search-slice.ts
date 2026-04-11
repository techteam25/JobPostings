import { StateCreator } from "zustand";
import { FiltersState, SearchState } from "../store";

export const searchSlice: StateCreator<FiltersState, [], [], SearchState> = (
  set,
  get,
) => ({
  keyword: "",
  location: "",
  setKeyword: (keyword) => {
    const updates: Partial<FiltersState> = { keyword };
    if (!keyword.trim() && get().sortBy === "relevant") {
      updates.sortBy = "recent";
    }
    set(updates);
  },
  setLocation: (location) => set(() => ({ location })),
});
