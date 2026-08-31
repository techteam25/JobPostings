import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ApplicantDetailSheet } from "../ApplicantDetailSheet";
import type { OrganizationJobApplications } from "@/lib/types";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("@/lib/axios-instance", () => ({
  instance: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createApplication(): OrganizationJobApplications {
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
  };
}

describe("ApplicantDetailSheet notes", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockGet.mockResolvedValue({ data: { data: [] } });
  });

  it("loads and displays existing notes", async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            note: "Strong background in missions work.",
            createdAt: "2025-06-17T10:00:00.000Z",
          },
        ],
      },
    });

    render(
      <ApplicantDetailSheet
        application={createApplication()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(/strong background in missions work/i),
    ).toBeInTheDocument();
  });

  it("adds a note and refreshes the thread", async () => {
    const user = userEvent.setup();

    mockGet
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              note: "Follow up next week.",
              createdAt: "2025-06-18T10:00:00.000Z",
            },
          ],
        },
      });

    mockPost.mockResolvedValue({ data: { success: true } });

    render(
      <ApplicantDetailSheet
        application={createApplication()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /internal note/i }),
      "Follow up next week.",
    );
    await user.click(screen.getByRole("button", { name: /add note/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/organizations/1/jobs/101/applications/1/notes",
        { note: "Follow up next week." },
      );
    });

    expect(await screen.findByText(/follow up next week/i)).toBeInTheDocument();
  });

  it("rejects an empty note without calling the API", async () => {
    const user = userEvent.setup();

    render(
      <ApplicantDetailSheet
        application={createApplication()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add note/i }));

    expect(screen.getByText(/note cannot be empty/i)).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("leaves the thread unchanged when save fails", async () => {
    const user = userEvent.setup();

    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            note: "Existing note.",
            createdAt: "2025-06-17T10:00:00.000Z",
          },
        ],
      },
    });
    mockPost.mockRejectedValue(new Error("Failed to save note"));

    render(
      <ApplicantDetailSheet
        application={createApplication()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(await screen.findByText(/existing note/i)).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: /internal note/i }),
      "This should not save.",
    );
    await user.click(screen.getByRole("button", { name: /add note/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });

    const notesSection = screen.getByRole("heading", {
      name: /internal notes/i,
    }).parentElement;
    expect(notesSection).not.toBeNull();
    expect(notesSection!.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByText(/existing note/i)).toBeInTheDocument();
  });
});
