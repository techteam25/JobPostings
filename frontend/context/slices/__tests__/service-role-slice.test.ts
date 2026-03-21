import { useFiltersStore } from "@/context/store";

describe("serviceRoleSlice", () => {
  beforeEach(() => {
    useFiltersStore.setState({ serviceRoles: [] });
  });

  it("defaults to empty array", () => {
    expect(useFiltersStore.getState().serviceRoles).toEqual([]);
  });

  it("sets service roles", () => {
    useFiltersStore.getState().setServiceRoles(["paid", "missionary"]);
    expect(useFiltersStore.getState().serviceRoles).toEqual([
      "paid",
      "missionary",
    ]);
  });
});
