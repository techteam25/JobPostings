import { useSavedJobsStore } from "@/context/store";

describe("savedJobsSlice", () => {
  beforeEach(() => {
    useSavedJobsStore.setState({ savedJobIds: new Set<number>() });
  });

  it("defaults to empty set", () => {
    expect(useSavedJobsStore.getState().savedJobIds.size).toBe(0);
  });

  it("saves a job", () => {
    useSavedJobsStore.getState().setSavedJob(42, true);
    expect(useSavedJobsStore.getState().isSaved(42)).toBe(true);
  });

  it("unsaves a job", () => {
    useSavedJobsStore.getState().setSavedJob(42, true);
    useSavedJobsStore.getState().setSavedJob(42, false);
    expect(useSavedJobsStore.getState().isSaved(42)).toBe(false);
  });

  it("manages multiple jobs independently", () => {
    const { setSavedJob } = useSavedJobsStore.getState();
    setSavedJob(1, true);
    setSavedJob(2, true);
    setSavedJob(3, true);

    setSavedJob(2, false);

    const state = useSavedJobsStore.getState();
    expect(state.isSaved(1)).toBe(true);
    expect(state.isSaved(2)).toBe(false);
    expect(state.isSaved(3)).toBe(true);
  });

  it("does not error when unsaving a non-existent job", () => {
    expect(() => {
      useSavedJobsStore.getState().setSavedJob(999, false);
    }).not.toThrow();
    expect(useSavedJobsStore.getState().isSaved(999)).toBe(false);
  });
});
