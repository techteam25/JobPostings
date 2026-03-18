import {
  useFiltersStore,
  useSavedJobsStore,
  useApplicationStore,
} from "@/context/store";

describe("useFiltersStore (composed)", () => {
  beforeEach(() => {
    useFiltersStore.setState({
      remoteOnly: false,
      jobTypes: [],
      serviceRoles: [],
      datePosted: null,
      sortBy: "recent",
    });
    localStorage.clear();
  });

  it("has correct initial state from all slices", () => {
    const state = useFiltersStore.getState();
    expect(state.remoteOnly).toBe(false);
    expect(state.jobTypes).toEqual([]);
    expect(state.serviceRoles).toEqual([]);
    expect(state.datePosted).toBeNull();
    expect(state.sortBy).toBe("recent");
  });

  it("allows setting multiple filters independently", () => {
    const state = useFiltersStore.getState();
    state.setJobTypes(["full-time"]);
    state.setServiceRoles(["paid"]);
    state.setSortBy("relevant");

    const updated = useFiltersStore.getState();
    expect(updated.jobTypes).toEqual(["full-time"]);
    expect(updated.serviceRoles).toEqual(["paid"]);
    expect(updated.sortBy).toBe("relevant");
    expect(updated.remoteOnly).toBe(false);
    expect(updated.datePosted).toBeNull();
  });

  it("persists state to localStorage", () => {
    useFiltersStore.getState().setJobTypes(["contract"]);

    // Zustand persist writes asynchronously; trigger rehydration check
    const stored = localStorage.getItem("filters-storage");
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.state.jobTypes).toEqual(["contract"]);
    }
  });
});

describe("store isolation", () => {
  beforeEach(() => {
    useFiltersStore.setState({
      remoteOnly: false,
      jobTypes: [],
      serviceRoles: [],
      datePosted: null,
      sortBy: "recent",
    });
    useSavedJobsStore.setState({ savedJobIds: new Set<number>() });
    useApplicationStore.setState({
      step: 1,
      formData: {
        resume: null,
        coverLetter: null,
        country: "",
        city: "",
        state: "",
        zipcode: "",
        customAnswers: {
          salvationStatement: "",
          race: "",
          gender: undefined,
          veteranStatus: "",
          yearsOfExperience: "",
          authorized: undefined,
        },
      },
    });
  });

  it("changes to filters do not affect saved jobs store", () => {
    useFiltersStore.getState().setJobTypes(["full-time"]);
    expect(useSavedJobsStore.getState().savedJobIds.size).toBe(0);
  });

  it("changes to filters do not affect application store", () => {
    useFiltersStore.getState().setRemoteOnly(true);
    expect(useApplicationStore.getState().step).toBe(1);
  });

  it("changes to saved jobs do not affect filters store", () => {
    useSavedJobsStore.getState().setSavedJob(1, true);
    expect(useFiltersStore.getState().jobTypes).toEqual([]);
  });

  it("changes to application store do not affect other stores", () => {
    useApplicationStore.getState().setStep(3);
    expect(useFiltersStore.getState().sortBy).toBe("recent");
    expect(useSavedJobsStore.getState().savedJobIds.size).toBe(0);
  });
});
