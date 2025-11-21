import { StateCreator } from "zustand";
import { FiltersState, ServiceFiltersState } from "../store";

export const serviceRoleSlice: StateCreator<
  FiltersState,
  [],
  [],
  ServiceFiltersState
> = (set) => ({
  serviceRoles: [],
  setServiceRoles: (roles) => set(() => ({ serviceRoles: roles })),
});
