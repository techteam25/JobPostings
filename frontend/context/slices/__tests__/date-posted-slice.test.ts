import { useFiltersStore } from "@/context/store";

describe("datePostedSlice", () => {
  beforeEach(() => {
    useFiltersStore.setState({ datePosted: null });
  });

  it("defaults to null", () => {
    expect(useFiltersStore.getState().datePosted).toBeNull();
  });

  it("sets date posted filter", () => {
    useFiltersStore.getState().setDatePosted("last-24-hours");
    expect(useFiltersStore.getState().datePosted).toBe("last-24-hours");
  });

  it("clears date posted filter", () => {
    useFiltersStore.setState({ datePosted: "last-7-days" });
    useFiltersStore.getState().setDatePosted(null);
    expect(useFiltersStore.getState().datePosted).toBeNull();
  });
});
