import { useFiltersStore } from "@/context/store";

describe("searchSlice", () => {
  beforeEach(() => {
    useFiltersStore.setState({ keyword: "", location: "" });
  });

  it("defaults keyword and location to empty strings", () => {
    const state = useFiltersStore.getState();
    expect(state.keyword).toBe("");
    expect(state.location).toBe("");
  });

  it("setKeyword updates the keyword", () => {
    useFiltersStore.getState().setKeyword("React developer");
    expect(useFiltersStore.getState().keyword).toBe("React developer");
  });

  it("setLocation updates the location", () => {
    useFiltersStore.getState().setLocation("Boston, MA");
    expect(useFiltersStore.getState().location).toBe("Boston, MA");
  });

  it("setKeyword and setLocation are independent", () => {
    useFiltersStore.getState().setKeyword("engineer");
    useFiltersStore.getState().setLocation("TX");
    const state = useFiltersStore.getState();
    expect(state.keyword).toBe("engineer");
    expect(state.location).toBe("TX");
  });

  it("setKeyword('') clears the keyword", () => {
    useFiltersStore.setState({ keyword: "react" });
    useFiltersStore.getState().setKeyword("");
    expect(useFiltersStore.getState().keyword).toBe("");
  });
});
