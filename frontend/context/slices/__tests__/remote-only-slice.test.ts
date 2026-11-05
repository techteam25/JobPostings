import { useFiltersStore } from "@/context/store";

describe("remoteOnlySlice", () => {
  beforeEach(() => {
    useFiltersStore.setState({ remoteOnly: false });
  });

  it("defaults to false", () => {
    expect(useFiltersStore.getState().remoteOnly).toBe(false);
  });

  it("sets remoteOnly to true from false", () => {
    useFiltersStore.getState().setRemoteOnly(true);
    expect(useFiltersStore.getState().remoteOnly).toBe(true);
  });

  it("sets remoteOnly to false from true", () => {
    useFiltersStore.setState({ remoteOnly: true });
    useFiltersStore.getState().setRemoteOnly(false);
    expect(useFiltersStore.getState().remoteOnly).toBe(false);
  });

  it("setRemoteOnly(true) is idempotent when already true", () => {
    useFiltersStore.setState({ remoteOnly: true });
    useFiltersStore.getState().setRemoteOnly(true);
    expect(useFiltersStore.getState().remoteOnly).toBe(true);
  });

  it("setRemoteOnly(false) is idempotent when already false", () => {
    useFiltersStore.getState().setRemoteOnly(false);
    expect(useFiltersStore.getState().remoteOnly).toBe(false);
  });
});
