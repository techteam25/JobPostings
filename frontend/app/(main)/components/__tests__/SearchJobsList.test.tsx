import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { SearchJobsList } from "../SearchJobsList";
import type { SearchJobResult } from "@/schemas/responses/jobs/search";

function makeResult(overrides: Partial<SearchJobResult> = {}): SearchJobResult {
  return {
    id: "42",
    title: "Senior Engineer",
    company: "Acme Corp",
    description: "Build great things",
    city: "Boston",
    state: "MA",
    country: "USA",
    isRemote: false,
    experience: "Senior",
    jobType: "full-time",
    skills: ["React", "TypeScript"],
    createdAt: Date.parse("2025-01-01"),
    logoUrl: "https://example.com/logo.png" as string | undefined,
    ...overrides,
  };
}

describe("SearchJobsList", () => {
  it("maps result.title to JobCard positionName", () => {
    render(
      <SearchJobsList
        data={[makeResult({ title: "Frontend Wizard" })]}
        onJobSelected={() => {}}
        selectedId={undefined}
      />,
    );

    expect(screen.getByText("Frontend Wizard")).toBeInTheDocument();
  });

  it("maps result.company to JobCard companyName", () => {
    render(
      <SearchJobsList
        data={[makeResult({ company: "Globex" })]}
        onJobSelected={() => {}}
        selectedId={undefined}
      />,
    );

    expect(screen.getByText("Globex")).toBeInTheDocument();
  });

  it("joins city and state into the displayed location", () => {
    render(
      <SearchJobsList
        data={[makeResult({ city: "Austin", state: "TX" })]}
        onJobSelected={() => {}}
        selectedId={undefined}
      />,
    );

    expect(screen.getByText("Austin, TX")).toBeInTheDocument();
  });

  it("falls back to 'Remote' when both city and state are empty", () => {
    render(
      <SearchJobsList
        data={[makeResult({ city: undefined, state: undefined })]}
        onJobSelected={() => {}}
        selectedId={undefined}
      />,
    );

    expect(screen.getByText("Remote")).toBeInTheDocument();
  });

  it("falls back to 'Not Specified' when experience is missing", () => {
    render(
      <SearchJobsList
        data={[makeResult({ experience: undefined })]}
        onJobSelected={() => {}}
        selectedId={undefined}
      />,
    );

    expect(screen.getByText("Not Specified")).toBeInTheDocument();
  });

  it("coerces string id to number when invoking onJobSelected", async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <SearchJobsList
        data={[makeResult({ id: "123", title: "Click Me" })]}
        onJobSelected={handleSelect}
        selectedId={undefined}
      />,
    );

    await user.click(screen.getByText("Click Me"));

    expect(handleSelect).toHaveBeenCalledWith(123);
    expect(typeof handleSelect.mock.calls[0]?.[0]).toBe("number");
  });

  it("renders multiple jobs with stable keys", () => {
    render(
      <SearchJobsList
        data={[
          makeResult({ id: "1", title: "Job One" }),
          makeResult({ id: "2", title: "Job Two" }),
          makeResult({ id: "3", title: "Job Three" }),
        ]}
        onJobSelected={() => {}}
        selectedId={undefined}
      />,
    );

    expect(screen.getByText("Job One")).toBeInTheDocument();
    expect(screen.getByText("Job Two")).toBeInTheDocument();
    expect(screen.getByText("Job Three")).toBeInTheDocument();
  });
});
