import { useFiltersStore } from "@/context/store";

describe("sortBySlice", () => {
  beforeEach(() => {
    useFiltersStore.setState({ sortBy: "recent" });
  });

  it("defaults to 'recent'", () => {
    expect(useFiltersStore.getState().sortBy).toBe("recent");
  });

  it("sets sort by to 'relevant'", () => {
    useFiltersStore.getState().setSortBy("relevant");
    expect(useFiltersStore.getState().sortBy).toBe("relevant");
  });
});
