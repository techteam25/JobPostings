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

  it("clicking 'Apply Filters' closes the drawer", async () => {
    const user = userEvent.setup();
    render(<SearchFiltersMobile />);

    await user.click(screen.getByRole("button", { name: /open filters/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-state", "open");

    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    // Vaul keeps the dialog mounted while it animates out, so assert on the
    // closed data-state instead of element absence.
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "data-state",
        "closed",
      );
    });
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
});
