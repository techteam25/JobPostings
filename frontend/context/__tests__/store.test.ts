import { useFiltersStore, useApplicationStore } from "@/context/store";

describe("useFiltersStore (composed)", () => {
  beforeEach(() => {
    useFiltersStore.setState({
      remoteOnly: false,
      jobTypes: [],
      serviceRoles: [],
      datePosted: null,
      sortBy: "recent",
      keyword: "",
      location: "",
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

  it("changes to filters do not affect application store", () => {
    useFiltersStore.getState().setRemoteOnly(true);
    expect(useApplicationStore.getState().step).toBe(1);
  });

  it("changes to application store do not affect filters store", () => {
    useApplicationStore.getState().setStep(3);
    expect(useFiltersStore.getState().sortBy).toBe("recent");
  });
});

describe("module-level URL sync", () => {
  // The module-level subscribe in store.ts mirrors Zustand → URL with a 300ms
  // debounce. These tests exercise the subscriber on the already-loaded module
  // instance — we don't reset modules because the subscriber is one-shot at
  // module init.

  let replaceStateSpy: ReturnType<typeof vi.spyOn>;
  const originalSearch = window.location.search;
  const originalPathname = window.location.pathname;

  beforeEach(() => {
    vi.useFakeTimers();
    useFiltersStore.setState({
      remoteOnly: false,
      jobTypes: [],
      serviceRoles: [],
      datePosted: null,
      sortBy: "recent",
      keyword: "",
      location: "",
    });
    localStorage.clear();
    // Run any pending debounce callbacks from the previous test before
    // installing a fresh spy, so they don't pollute call counts.
    vi.runAllTimers();
    replaceStateSpy = vi.spyOn(window.history, "replaceState");
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    replaceStateSpy.mockRestore();
    window.history.replaceState(
      null,
      "",
      `${originalPathname}${originalSearch}`,
    );
  });

  it("setKeyword triggers a debounced URL replace after 300ms", () => {
    useFiltersStore.getState().setKeyword("react");

    // Before the timer fires the URL should not have been written.
    expect(replaceStateSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
    const [, , urlArg] = replaceStateSpy.mock.calls[0]!;
    expect(String(urlArg)).toContain("q=react");
  });

  it("rapid setKeyword calls coalesce into a single replaceState", () => {
    const store = useFiltersStore.getState();
    store.setKeyword("r");
    store.setKeyword("re");
    store.setKeyword("rea");
    store.setKeyword("reac");
    store.setKeyword("react");

    // Even though we changed state 5 times, the debounce should only fire once.
    vi.advanceTimersByTime(300);

    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
    const [, , urlArg] = replaceStateSpy.mock.calls[0]!;
    expect(String(urlArg)).toContain("q=react");
  });

  it("setting jobTypes propagates to the URL", () => {
    useFiltersStore.getState().setJobTypes(["full-time", "contract"]);

    vi.advanceTimersByTime(300);

    expect(replaceStateSpy).toHaveBeenCalled();
    const calls = replaceStateSpy.mock.calls;
    const lastUrl = String(calls[calls.length - 1]?.[2] ?? "");
    expect(lastUrl).toContain("jobType=full-time");
    expect(lastUrl).toContain("jobType=contract");
  });

  it("clearing all filters writes a URL with no search params", () => {
    useFiltersStore.setState({ keyword: "react", jobTypes: ["full-time"] });
    vi.advanceTimersByTime(300);
    replaceStateSpy.mockClear();

    useFiltersStore.setState({ keyword: "", jobTypes: [] });
    vi.advanceTimersByTime(300);

    expect(replaceStateSpy).toHaveBeenCalled();
    const lastUrl = String(
      replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1]?.[2] ??
        "",
    );
    // After clearing, the URL should not contain any search-related params.
    expect(lastUrl).not.toContain("q=");
    expect(lastUrl).not.toContain("jobType=");
  });
});
