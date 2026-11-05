import { render, screen, within } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { SearchInputMobile } from "../SearchInputMobile";
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

describe("SearchInputMobile", () => {
  beforeEach(() => {
    resetStore();
  });

  it("opening the drawer hydrates the inputs from the store", async () => {
    const user = userEvent.setup();
    useFiltersStore.setState({ keyword: "react", location: "Boston, MA" });

    render(<SearchInputMobile />);

    await user.click(
      screen.getByRole("button", { name: /find your next role/i }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Search for jobs")).toHaveValue(
      "react",
    );
    expect(within(dialog).getByLabelText("Search by location")).toHaveValue(
      "Boston, MA",
    );
  });

  it("Enter on keyword input focuses the location input without committing", async () => {
    const user = userEvent.setup();
    const onSearchCommitted = vi.fn();

    render(<SearchInputMobile onSearchCommitted={onSearchCommitted} />);

    await user.click(
      screen.getByRole("button", { name: /find your next role/i }),
    );

    const dialog = await screen.findByRole("dialog");
    const keywordInput = within(dialog).getByLabelText("Search for jobs");
    const locationInput = within(dialog).getByLabelText("Search by location");

    await user.click(keywordInput);
    await user.type(keywordInput, "engineer");
    await user.keyboard("{Enter}");

    expect(locationInput).toHaveFocus();
    expect(onSearchCommitted).not.toHaveBeenCalled();
    expect(useFiltersStore.getState().keyword).toBe("");
  });

  it("Enter on location input commits and closes the drawer", async () => {
    const user = userEvent.setup();
    const onSearchCommitted = vi.fn();

    render(<SearchInputMobile onSearchCommitted={onSearchCommitted} />);

    await user.click(
      screen.getByRole("button", { name: /find your next role/i }),
    );

    const dialog = await screen.findByRole("dialog");
    const keywordInput = within(dialog).getByLabelText("Search for jobs");
    const locationInput = within(dialog).getByLabelText("Search by location");

    await user.click(keywordInput);
    await user.type(keywordInput, "designer");
    await user.click(locationInput);
    await user.type(locationInput, "Austin");
    await user.keyboard("{Enter}");

    expect(useFiltersStore.getState().keyword).toBe("designer");
    expect(useFiltersStore.getState().location).toBe("Austin");
    expect(onSearchCommitted).toHaveBeenCalledTimes(1);
  });

  it("clicking the Search button commits the local state", async () => {
    const user = userEvent.setup();
    const onSearchCommitted = vi.fn();

    render(<SearchInputMobile onSearchCommitted={onSearchCommitted} />);

    await user.click(
      screen.getByRole("button", { name: /find your next role/i }),
    );

    const dialog = await screen.findByRole("dialog");
    const keywordInput = within(dialog).getByLabelText("Search for jobs");

    await user.click(keywordInput);
    await user.type(keywordInput, "marketing");

    await user.click(within(dialog).getByRole("button", { name: /^search$/i }));

    expect(useFiltersStore.getState().keyword).toBe("marketing");
    expect(onSearchCommitted).toHaveBeenCalledTimes(1);
  });
});
