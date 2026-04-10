import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { SearchFiltersMobile } from "../SearchFiltersMobile";
import { useFiltersStore } from "@/context/store";

function resetStore() {
  useFiltersStore.setState({
    keyword: "",
    location: "",
    jobTypes: [],
    serviceRoles: [],
    remoteOnly: false,
    sortBy: "recent",
    datePosted: null,
  });
}

describe("SearchFiltersMobile", () => {
  beforeEach(() => {
    resetStore();
  });

  it("clicking 'Apply Filters' commits pending changes and closes the drawer", async () => {
    const user = userEvent.setup();
    render(<SearchFiltersMobile />);

    await user.click(screen.getByRole("button", { name: /open filters/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-state", "open");

    // Toggle Remote Only inside the drawer
    await user.click(screen.getByRole("switch", { name: /remote only/i }));

    // Open Job Type accordion and check Full-time
    await user.click(screen.getByText("Job Type"));
    await user.click(screen.getByRole("checkbox", { name: /full-time/i }));

    // Before Apply: Zustand should NOT be updated
    expect(useFiltersStore.getState().remoteOnly).toBe(false);
    expect(useFiltersStore.getState().jobTypes).toEqual([]);

    // Apply
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    // After Apply: Zustand should be updated
    expect(useFiltersStore.getState().remoteOnly).toBe(true);
    expect(useFiltersStore.getState().jobTypes).toEqual(["full-time"]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "data-state",
        "closed",
      );
    });
  });

  it("closing via X discards pending changes", async () => {
    const user = userEvent.setup();
    render(<SearchFiltersMobile />);

    await user.click(screen.getByRole("button", { name: /open filters/i }));
    await screen.findByRole("dialog");

    // Toggle Remote Only
    await user.click(screen.getByRole("switch", { name: /remote only/i }));

    // Close via X button (DrawerClose)
    await user.click(screen.getByRole("button", { name: /close filters/i }));

    // Zustand should NOT be updated
    expect(useFiltersStore.getState().remoteOnly).toBe(false);
  });

  it("snapshots current Zustand state when drawer opens", async () => {
    const user = userEvent.setup();

    // Pre-set some Zustand state
    useFiltersStore.setState({
      jobTypes: ["contract"],
      remoteOnly: true,
    });

    render(<SearchFiltersMobile />);

    await user.click(screen.getByRole("button", { name: /open filters/i }));
    await screen.findByRole("dialog");

    // Remote Only should reflect the snapshot
    const toggle = screen.getByRole("switch", { name: /remote only/i });
    expect(toggle).toBeChecked();

    // Job Type accordion should show contract checked
    await user.click(screen.getByText("Job Type"));
    expect(screen.getByRole("checkbox", { name: /contract/i })).toBeChecked();
  });

  it("'Clear All' resets every searchable filter and closes the drawer", async () => {
    const user = userEvent.setup();

    useFiltersStore.setState({
      jobTypes: ["full-time", "contract"],
      serviceRoles: ["paid"],
      remoteOnly: true,
      datePosted: "last-7-days",
      sortBy: "relevant",
    });

    render(<SearchFiltersMobile />);

    await user.click(screen.getByRole("button", { name: /open filters/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-state", "open");

    await user.click(screen.getByRole("button", { name: /clear all/i }));

    const state = useFiltersStore.getState();
    expect(state.jobTypes).toEqual([]);
    expect(state.serviceRoles).toEqual([]);
    expect(state.remoteOnly).toBe(false);
    expect(state.datePosted).toBeNull();
    expect(state.sortBy).toBe("recent");

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "data-state",
        "closed",
      );
    });
  });

  it("'Clear All' does not touch search keyword/location", async () => {
    const user = userEvent.setup();

    useFiltersStore.setState({
      keyword: "react",
      location: "Boston, MA",
      jobTypes: ["full-time"],
    });

    render(<SearchFiltersMobile />);

    await user.click(screen.getByRole("button", { name: /open filters/i }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /clear all/i }));

    const state = useFiltersStore.getState();
    expect(state.keyword).toBe("react");
    expect(state.location).toBe("Boston, MA");
    expect(state.jobTypes).toEqual([]);
  });

  it("includes Volunteer in job type options", async () => {
    const user = userEvent.setup();
    render(<SearchFiltersMobile />);

    await user.click(screen.getByRole("button", { name: /open filters/i }));
    await screen.findByRole("dialog");

    await user.click(screen.getByText("Job Type"));
    expect(screen.getByLabelText("Volunteer")).toBeInTheDocument();
  });
});
