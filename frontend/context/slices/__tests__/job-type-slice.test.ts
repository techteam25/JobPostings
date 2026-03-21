import { useFiltersStore } from "@/context/store";

describe("jobTypeSlice", () => {
  beforeEach(() => {
    useFiltersStore.setState({ jobTypes: [] });
  });

  it("defaults to empty array", () => {
    expect(useFiltersStore.getState().jobTypes).toEqual([]);
  });

  it("sets job types", () => {
    useFiltersStore.getState().setJobTypes(["full-time", "contract"]);
    expect(useFiltersStore.getState().jobTypes).toEqual([
      "full-time",
      "contract",
    ]);
  });

  it("clears job types", () => {
    useFiltersStore.setState({ jobTypes: ["internship"] });
    useFiltersStore.getState().setJobTypes([]);
    expect(useFiltersStore.getState().jobTypes).toEqual([]);
  });
});
