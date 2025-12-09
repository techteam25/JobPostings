import { StateCreator } from "zustand";

export interface SavedJobsState {
  savedJobIds: Set<number>;
  setSavedJob: (jobId: number, isSaved: boolean) => void;
  isSaved: (jobId: number) => boolean;
}

export const savedJobsSlice: StateCreator<SavedJobsState> = (set, get) => ({
  savedJobIds: new Set<number>(),
  setSavedJob: (jobId: number, isSaved: boolean) =>
    set((state) => {
      const newSet = new Set(state.savedJobIds);
      if (isSaved) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return { savedJobIds: newSet };
    }),
  isSaved: (jobId: number) => get().savedJobIds.has(jobId),
});
