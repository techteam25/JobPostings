import { StateCreator } from "zustand";
import { FiltersState, SearchState } from "../store";

export const searchSlice: StateCreator<FiltersState, [], [], SearchState> = (
  set,
) => ({
  keyword: "",
  location: "",
  setKeyword: (keyword) => set(() => ({ keyword })),
  setLocation: (location) => set(() => ({ location })),
});
