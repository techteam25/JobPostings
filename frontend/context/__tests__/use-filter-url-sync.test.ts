import { renderHook, act } from "@testing-library/react";

import { useFiltersStore } from "@/context/store";
import { useFilterUrlSync } from "@/context/use-filter-url-sync";

function resetStore() {
  useFiltersStore.setState({
    remoteOnly: false,
    jobTypes: [],
    serviceRoles: [],
    datePosted: null,
    sortBy: "recent",
    keyword: "",
    location: "",
  });
}

const originalPathname = window.location.pathname;
const originalSearch = window.location.search;

describe("useFilterUrlSync", () => {
  let replaceStateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetStore();
    localStorage.clear();
    window.history.replaceState(null, "", `${originalPathname}`);
    replaceStateSpy = vi.spyOn(window.history, "replaceState");
  });

  afterEach(() => {
    replaceStateSpy.mockRestore();
    window.history.replaceState(
      null,
      "",
      `${originalPathname}${originalSearch}`,
    );
  });

  it("pushes store state into the URL on mount", () => {
    useFiltersStore.setState({ keyword: "react" });
    replaceStateSpy.mockClear();

    renderHook(() => useFilterUrlSync());

    expect(replaceStateSpy).toHaveBeenCalled();
    const lastUrl = String(replaceStateSpy.mock.calls.at(-1)?.[2] ?? "");
    expect(lastUrl).toContain("q=react");
  });

  it("seeds the store from the URL when the URL has search params", () => {
    window.history.replaceState(
      null,
      "",
      `${originalPathname}?includeRemote=true`,
    );

    renderHook(() => useFilterUrlSync());

    expect(useFiltersStore.getState().remoteOnly).toBe(true);
  });

  it("writes filter changes to the URL while mounted", () => {
    const { result: _ } = renderHook(() => useFilterUrlSync());
    replaceStateSpy.mockClear();

    act(() => {
      useFiltersStore.getState().setJobTypes(["full-time"]);
    });

    expect(replaceStateSpy).toHaveBeenCalled();
    const lastUrl = String(replaceStateSpy.mock.calls.at(-1)?.[2] ?? "");
    expect(lastUrl).toContain("jobType=full-time");
  });

  it("stops writing to the URL after unmount", () => {
    const { unmount } = renderHook(() => useFilterUrlSync());
    unmount();
    replaceStateSpy.mockClear();

    act(() => {
      useFiltersStore.getState().setKeyword("typescript");
    });

    expect(replaceStateSpy).not.toHaveBeenCalled();
  });

  it("updates the store on popstate when the URL has search params", () => {
    renderHook(() => useFilterUrlSync());

    window.history.replaceState(
      null,
      "",
      `${originalPathname}?jobType=contract`,
    );
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(useFiltersStore.getState().jobTypes).toEqual(["contract"]);
  });
});
