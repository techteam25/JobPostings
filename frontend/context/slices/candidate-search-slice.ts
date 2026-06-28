import { StateCreator } from "zustand";

import type { CandidateSearchFiltersState } from "../candidate-search-store";

export const candidateSearchFiltersSlice: StateCreator<
  CandidateSearchFiltersState,
  [],
  [],
  CandidateSearchFiltersState
> = (set) => ({
  skills: [],
  location: "",
  locationFilter: "",
  locationZipcode: "",
  minYearsExperience: null,
  openToWork: false,

  setSkills: (skills) => set({ skills }),
  addSkill: (skill) =>
    set((state) =>
      state.skills.includes(skill)
        ? state
        : { skills: [...state.skills, skill] },
    ),
  removeSkill: (skill) =>
    set((state) => ({ skills: state.skills.filter((s) => s !== skill) })),
  setLocation: (location, filterValue, zipcode) =>
    set({
      location,
      locationFilter: filterValue ?? location,
      locationZipcode: zipcode ?? "",
    }),
  setMinYearsExperience: (minYearsExperience) => set({ minYearsExperience }),
  setOpenToWork: (openToWork) => set({ openToWork }),
  clearFilters: () =>
    set({
      skills: [],
      location: "",
      locationFilter: "",
      locationZipcode: "",
      minYearsExperience: null,
      openToWork: false,
    }),
});
