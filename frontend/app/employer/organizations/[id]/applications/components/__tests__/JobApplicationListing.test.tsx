import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { JobApplicationListing } from "../JobApplicationListing";
import { instance } from "@/lib/axios-instance";
import type {
  OrganizationJobApplications,
  PaginatedApiResponse,
} from "@/lib/types";

vi.mock("@/lib/axios-instance", () => ({
  instance: {
    get: vi.fn(() => Promise.resolve({ data: { data: [] } })),
    patch: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createApplication(
  overrides: Partial<OrganizationJobApplications> = {},
): OrganizationJobApplications {
  return {
    applicationId: 1,
    jobId: 101,
    applicantName: "Jane Doe",
    applicantEmail: "jane@example.com",
    status: "reviewed",
    coverLetter: "I am interested in this role.",
    resumeUrl: "https://example.com/resume.pdf",
    appliedAt: new Date("2025-06-15T10:00:00Z"),
    reviewedAt: new Date("2025-06-16T14:00:00Z"),
    jobTitle: "Software Engineer",
    organizationId: 1,
    organizationName: "Test Org",
    ...overrides,
  };
}

function createPaginatedResponse(
  data: OrganizationJobApplications[],
): PaginatedApiResponse<OrganizationJobApplications> {
  return {
    success: true,
    message: "ok",
    data,
    pagination: {
      page: 1,
      limit: 10,
      total: data.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
      nextPage: null,
      previousPage: null,
    },
  };
}

function getStatCardValue(label: string): string | undefined {
  const statLabel = screen
    .getAllByText(label)
    .find((element) => element.classList.contains("text-gray-600"));
  return (
    statLabel?.parentElement?.querySelector(".text-2xl")?.textContent ??
    undefined
  );
}

describe("JobApplicationListing", () => {
  beforeEach(() => {
    vi.mocked(instance.patch).mockReset();
  });

  it("lists applicants under each job group", () => {
    const applications = createPaginatedResponse([
      createApplication({ applicationId: 1, applicantName: "Jane Doe" }),
      createApplication({
        applicationId: 2,
        applicantName: "John Smith",
        status: "withdrawn",
        coverLetter: null,
        resumeUrl: null,
        reviewedAt: null,
      }),
    ]);

    render(
      <JobApplicationListing organizationId={1} applications={applications} />,
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("opens applicant details when an applicant is selected", async () => {
    const user = userEvent.setup();
    const applications = createPaginatedResponse([
      createApplication({
        applicantName: "Jane Doe",
        applicantEmail: "jane@example.com",
        status: "reviewed",
        coverLetter: "I am interested in this role.",
        resumeUrl: "https://example.com/resume.pdf",
      }),
    ]);

    render(
      <JobApplicationListing organizationId={1} applications={applications} />,
    );

    await user.click(screen.getByRole("button", { name: /jane doe/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("jane@example.com");
    expect(dialog).toHaveTextContent("I am interested in this role.");
    expect(screen.getByRole("link", { name: /view resume/i })).toHaveAttribute(
      "href",
      "https://example.com/resume.pdf",
    );
    expect(dialog).toHaveTextContent("Under Review");
    expect(dialog).toHaveTextContent(/Applied:/i);
    expect(dialog).toHaveTextContent(/Reviewed:/i);
  });

  it("shows placeholders when cover letter and resume are missing", async () => {
    const user = userEvent.setup();
    const applications = createPaginatedResponse([
      createApplication({
        applicantName: "No Materials Applicant",
        coverLetter: null,
        resumeUrl: null,
        reviewedAt: null,
      }),
    ]);

    render(
      <JobApplicationListing organizationId={1} applications={applications} />,
    );

    await user.click(
      screen.getByRole("button", { name: /no materials applicant/i }),
    );

    expect(screen.getByText(/cover letter not provided/i)).toBeInTheDocument();
    expect(screen.getByText(/resume not provided/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /view resume/i }),
    ).not.toBeInTheDocument();
  });

  it("shows withdrawn applicants with the withdrawn status label", async () => {
    const user = userEvent.setup();
    const applications = createPaginatedResponse([
      createApplication({
        applicantName: "Withdrawn Applicant",
        status: "withdrawn",
        reviewedAt: null,
      }),
    ]);

    render(
      <JobApplicationListing organizationId={1} applications={applications} />,
    );

    await user.click(
      screen.getByRole("button", { name: /withdrawn applicant/i }),
    );

    expect(screen.getAllByText("Withdrawn").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /move to/i }),
    ).not.toBeInTheDocument();
  });

  it("updates the applications surface when an allowed status move succeeds", async () => {
    const user = userEvent.setup();
    const applications = createPaginatedResponse([
      createApplication({
        applicationId: 1,
        applicantName: "Pending Applicant",
        status: "pending",
        reviewedAt: null,
      }),
    ]);

    vi.mocked(instance.patch).mockResolvedValue({
      data: { success: true },
    });

    render(
      <JobApplicationListing organizationId={1} applications={applications} />,
    );

    expect(getStatCardValue("New")).toBe("1");

    await user.click(
      screen.getByRole("button", { name: /pending applicant/i }),
    );

    await user.click(
      screen.getByRole("button", { name: /move to under review/i }),
    );

    await waitFor(() => {
      expect(instance.patch).toHaveBeenCalledWith(
        "/organizations/1/jobs/101/applications/1/status",
        { status: "reviewed" },
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText("Under Review").length).toBeGreaterThan(0);
    });

    expect(getStatCardValue("New")).toBe("0");
    expect(getStatCardValue("Active")).toBe("1");
  });

  it("leaves status unchanged when a status move fails", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");
    const applications = createPaginatedResponse([
      createApplication({
        applicationId: 1,
        applicantName: "Pending Applicant",
        status: "pending",
        reviewedAt: null,
      }),
    ]);

    vi.mocked(instance.patch).mockRejectedValue(
      new Error("Invalid status transition from pending to reviewed"),
    );

    render(
      <JobApplicationListing organizationId={1} applications={applications} />,
    );

    await user.click(
      screen.getByRole("button", { name: /pending applicant/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /move to under review/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(screen.getAllByText("Submitted").length).toBeGreaterThan(0);
    expect(getStatCardValue("New")).toBe("1");
  });
});
