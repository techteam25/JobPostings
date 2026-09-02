import { render, screen } from "@/test/test-utils";
import { SavedJobCard } from "../SavedJobCard";
import type { SavedJob } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  removeSavedJobForUser: vi.fn().mockResolvedValue({ success: true }),
}));

function createSavedJob(overrides: Partial<SavedJob> = {}): SavedJob {
  return {
    id: 1,
    savedAt: new Date("2025-06-01T10:00:00Z"),
    isClosed: false,
    isExpired: false,
    job: {
      id: 42,
      title: "Missionary Teacher",
      city: "Nairobi",
      state: null,
      country: "Kenya",
      isActive: true,
      compensationType: "missionary",
      isRemote: false,
      applicationDeadline: null,
      jobType: "full-time",
      employer: {
        id: 10,
        name: "Global Missions Org",
        logoUrl: null,
        url: null,
      },
    },
    ...overrides,
  };
}

describe("SavedJobCard", () => {
  it("links View Job Details to the saved job detail page", () => {
    render(<SavedJobCard savedJob={createSavedJob()} />);

    const detailsLink = screen.getByRole("link", { name: /view job details/i });
    expect(detailsLink).toHaveAttribute("href", "/jobs/42");
  });

  it("does not link closed saved jobs to job details", () => {
    render(<SavedJobCard savedJob={createSavedJob({ isClosed: true })} />);

    expect(
      screen.queryByRole("link", { name: /view job details/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /job closed/i })).toBeDisabled();
  });

  it("does not link expired saved jobs to job details", () => {
    render(<SavedJobCard savedJob={createSavedJob({ isExpired: true })} />);

    expect(
      screen.queryByRole("link", { name: /view job details/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /job closed/i })).toBeDisabled();
  });
});
