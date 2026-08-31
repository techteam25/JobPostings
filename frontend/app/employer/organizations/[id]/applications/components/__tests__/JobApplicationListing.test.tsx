import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { JobApplicationListing } from "../JobApplicationListing";
import type {
  OrganizationJobApplications,
  PaginatedApiResponse,
} from "@/lib/types";

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

describe("JobApplicationListing", () => {
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

    render(<JobApplicationListing applications={applications} />);

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

    render(<JobApplicationListing applications={applications} />);

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

    render(<JobApplicationListing applications={applications} />);

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

    render(<JobApplicationListing applications={applications} />);

    await user.click(
      screen.getByRole("button", { name: /withdrawn applicant/i }),
    );

    expect(screen.getAllByText("Withdrawn").length).toBeGreaterThan(0);
  });
});
