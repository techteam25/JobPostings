import { useFiltersStore } from "@/context/store";

describe("remoteOnlySlice", () => {
  beforeEach(() => {
    useFiltersStore.setState({ remoteOnly: false });
  });

  it("defaults to false", () => {
    expect(useFiltersStore.getState().remoteOnly).toBe(false);
  });

  it("toggles remoteOnly to true", () => {
    useFiltersStore.getState().setRemoteOnly(true);
    expect(useFiltersStore.getState().remoteOnly).toBe(true);
  });

  it("toggles remoteOnly back to false", () => {
    useFiltersStore.setState({ remoteOnly: true });
    useFiltersStore.getState().setRemoteOnly(false);
    expect(useFiltersStore.getState().remoteOnly).toBe(false);
  });
});
