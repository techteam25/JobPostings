import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { DesktopSearchBar } from "../DesktopSearchBar";
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

describe("DesktopSearchBar", () => {
  beforeEach(() => {
    resetStore();
  });

  it("renders Zustand keyword and location values", () => {
    useFiltersStore.setState({ keyword: "react", location: "Austin, TX" });

    render(<DesktopSearchBar />);

    expect(screen.getByLabelText("Search for jobs")).toHaveValue("react");
    expect(screen.getByLabelText("Search by location")).toHaveValue(
      "Austin, TX",
    );
  });

  it("typing into keyword updates the input but not the store", async () => {
    const user = userEvent.setup();
    render(<DesktopSearchBar />);

    const keywordInput = screen.getByLabelText("Search for jobs");
    await user.type(keywordInput, "developer");

    expect(keywordInput).toHaveValue("developer");
    // The pending buffer holds the draft — the store keyword stays empty
    // until the user commits via Enter.
    expect(useFiltersStore.getState().keyword).toBe("");
  });

  it("Enter on keyword with empty location focuses location and does not commit", async () => {
    const user = userEvent.setup();
    const onSearchCommitted = vi.fn();

    render(<DesktopSearchBar onSearchCommitted={onSearchCommitted} />);

    const keywordInput = screen.getByLabelText("Search for jobs");
    const locationInput = screen.getByLabelText("Search by location");

    await user.type(keywordInput, "engineer");
    await user.keyboard("{Enter}");

    expect(locationInput).toHaveFocus();
    expect(onSearchCommitted).not.toHaveBeenCalled();
    expect(useFiltersStore.getState().keyword).toBe("");
  });

  it("Enter on keyword with location filled commits both fields", async () => {
    const user = userEvent.setup();
    const onSearchCommitted = vi.fn();

    useFiltersStore.setState({ location: "Boston, MA" });
    render(<DesktopSearchBar onSearchCommitted={onSearchCommitted} />);

    const keywordInput = screen.getByLabelText("Search for jobs");

    await user.click(keywordInput);
    await user.type(keywordInput, "react");
    await user.keyboard("{Enter}");

    expect(onSearchCommitted).toHaveBeenCalledTimes(1);
    expect(useFiltersStore.getState().keyword).toBe("react");
    expect(useFiltersStore.getState().location).toBe("Boston, MA");
  });

  it("Enter on location commits the search", async () => {
    const user = userEvent.setup();
    const onSearchCommitted = vi.fn();

    render(<DesktopSearchBar onSearchCommitted={onSearchCommitted} />);

    const keywordInput = screen.getByLabelText("Search for jobs");
    const locationInput = screen.getByLabelText("Search by location");

    await user.type(keywordInput, "designer");
    await user.click(locationInput);
    await user.type(locationInput, "NYC");
    await user.keyboard("{Enter}");

    expect(onSearchCommitted).toHaveBeenCalledTimes(1);
    expect(useFiltersStore.getState().keyword).toBe("designer");
    expect(useFiltersStore.getState().location).toBe("NYC");
  });

  it("Enter on empty keyword commits immediately and clears location", async () => {
    const user = userEvent.setup();
    const onSearchCommitted = vi.fn();

    // Simulate an active search
    useFiltersStore.setState({ keyword: "engineer", location: "TX" });
    render(<DesktopSearchBar onSearchCommitted={onSearchCommitted} />);

    const keywordInput = screen.getByLabelText("Search for jobs");

    // Clear the keyword
    await user.clear(keywordInput);
    await user.keyboard("{Enter}");

    expect(onSearchCommitted).toHaveBeenCalledTimes(1);
    expect(useFiltersStore.getState().keyword).toBe("");
    // Location is also cleared because empty keyword means "exit search"
    expect(useFiltersStore.getState().location).toBe("");
  });

  it("Enter on empty keyword does not focus location — commits directly", async () => {
    const user = userEvent.setup();
    const onSearchCommitted = vi.fn();

    render(<DesktopSearchBar onSearchCommitted={onSearchCommitted} />);

    const keywordInput = screen.getByLabelText("Search for jobs");
    const locationInput = screen.getByLabelText("Search by location");

    await user.click(keywordInput);
    await user.keyboard("{Enter}");

    // Should commit, not focus location
    expect(onSearchCommitted).toHaveBeenCalledTimes(1);
    expect(locationInput).not.toHaveFocus();
  });
});
