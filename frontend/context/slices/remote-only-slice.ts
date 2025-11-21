import { StateCreator } from "zustand";
import { FiltersState, RemoteOnlyFilterState } from "../store";

export const remoteOnlySlice: StateCreator<
  FiltersState,
  [],
  [],
  RemoteOnlyFilterState
> = (set) => ({
  remoteOnly: false,
  setRemoteOnly: () => set((state) => ({ remoteOnly: !state.remoteOnly })),
});
