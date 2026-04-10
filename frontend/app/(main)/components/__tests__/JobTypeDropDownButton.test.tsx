import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { JobTypeDropDownButton } from "../JobTypeDropDownButton";
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

describe("JobTypeDropDownButton", () => {
  beforeEach(() => {
    resetStore();
  });

  it("renders all 5 job type options including Volunteer", async () => {
    const user = userEvent.setup();
    render(<JobTypeDropDownButton />);

    await user.click(screen.getByRole("button", { name: /job type/i }));

    expect(screen.getByText("Full-time")).toBeInTheDocument();
    expect(screen.getByText("Part-time")).toBeInTheDocument();
    expect(screen.getByText("Contract")).toBeInTheDocument();
    expect(screen.getByText("Volunteer")).toBeInTheDocument();
    expect(screen.getByText("Internship")).toBeInTheDocument();
  });

  it("immediately updates Zustand when a job type is checked", async () => {
    const user = userEvent.setup();
    render(<JobTypeDropDownButton />);

    await user.click(screen.getByRole("button", { name: /job type/i }));
    await user.click(screen.getByText("Full-time"));

    expect(useFiltersStore.getState().jobTypes).toEqual(["full-time"]);
  });

  it("immediately updates Zustand when a job type is unchecked", async () => {
    useFiltersStore.setState({ jobTypes: ["full-time", "contract"] });
    const user = userEvent.setup();
    render(<JobTypeDropDownButton />);

    await user.click(screen.getByRole("button", { name: /job type/i }));
    await user.click(screen.getByText("Full-time"));

    expect(useFiltersStore.getState().jobTypes).toEqual(["contract"]);
  });

  it("reflects current Zustand state in checkboxes", async () => {
    useFiltersStore.setState({ jobTypes: ["volunteer", "internship"] });
    const user = userEvent.setup();
    render(<JobTypeDropDownButton />);

    await user.click(screen.getByRole("button", { name: /job type/i }));

    expect(
      screen.getByText("Volunteer").closest("[role='menuitemcheckbox']"),
    ).toHaveAttribute("data-state", "checked");
    expect(
      screen.getByText("Internship").closest("[role='menuitemcheckbox']"),
    ).toHaveAttribute("data-state", "checked");
    expect(
      screen.getByText("Full-time").closest("[role='menuitemcheckbox']"),
    ).toHaveAttribute("data-state", "unchecked");
  });
});
