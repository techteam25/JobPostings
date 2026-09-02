import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/test-utils";
import type { Job } from "@/schemas/responses/jobs";
import { JobListingTable } from "../JobListingTable";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    title: "Missionary Teacher",
    description: "Teach overseas",
    city: "Nairobi",
    state: "Nairobi",
    country: "Kenya",
    zipcode: null,
    jobType: "full-time",
    compensationType: "missionary",
    isRemote: false,
    isActive: true,
    applicationDeadline: null,
    experience: null,
    employerId: 10,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

async function openOptionsMenu(jobTitle: string) {
  const user = userEvent.setup();

  await user.click(
    screen.getByRole("button", {
      name: new RegExp(`options for ${jobTitle}`, "i"),
    }),
  );

  return user;
}

describe("JobListingTable edit action", () => {
  const organizationId = 10;
  const onCloseJob = vi.fn().mockResolvedValue(undefined);
  const onReopenJob = vi.fn().mockResolvedValue(undefined);
  const onDuplicate = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockPush.mockClear();
  });

  it("navigates to the edit page when Edit Job is selected", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 99, title: "Editable Role" })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
      />,
    );

    const user = await openOptionsMenu("Editable Role");
    await user.click(screen.getByRole("menuitem", { name: /edit job/i }));

    expect(mockPush).toHaveBeenCalledWith(
      "/employer/organizations/10/jobs/99/edit",
    );
  });
});

describe("JobListingTable reopen action", () => {
  const organizationId = 10;
  const onCloseJob = vi.fn().mockResolvedValue(undefined);
  const onReopenJob = vi.fn().mockResolvedValue(undefined);
  const onDuplicate = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    onReopenJob.mockClear();
  });

  it("offers Reopen for a closed listing", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 1, title: "Closed Role", isActive: false })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
      />,
    );

    await openOptionsMenu("Closed Role");
    expect(
      screen.getByRole("menuitem", { name: /reopen/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /close job/i }),
    ).not.toBeInTheDocument();
  });

  it("does not offer Reopen for an active listing", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 2, title: "Active Role", isActive: true })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
      />,
    );

    await openOptionsMenu("Active Role");
    expect(
      screen.queryByRole("menuitem", { name: /reopen/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /close job/i }),
    ).toBeInTheDocument();
  });

  it("reopens a closed listing when Reopen is selected", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 42, title: "Closed Role", isActive: false })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
      />,
    );

    const user = await openOptionsMenu("Closed Role");
    await user.click(screen.getByRole("menuitem", { name: /reopen/i }));

    expect(onReopenJob).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: /reopen job listing/i }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/application deadline/i), {
      target: { value: "2028-06-01" },
    });
    await user.click(screen.getByRole("button", { name: /^reopen$/i }));

    expect(onReopenJob).toHaveBeenCalledWith(42, "2028-06-01");
  });

  it("does not reopen when the deadline dialog is cancelled", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 42, title: "Closed Role", isActive: false })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
      />,
    );

    const user = await openOptionsMenu("Closed Role");
    await user.click(screen.getByRole("menuitem", { name: /reopen/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onReopenJob).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: /reopen job listing/i }),
    ).not.toBeInTheDocument();
  });

  it("uses a pointer cursor on options menu items", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 1, title: "Closed Role", isActive: false })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
      />,
    );

    await openOptionsMenu("Closed Role");
    expect(screen.getByRole("menuitem", { name: /reopen/i })).toHaveClass(
      "cursor-pointer",
    );
  });
});

describe("JobListingTable delete action", () => {
  const organizationId = 10;
  const onCloseJob = vi.fn().mockResolvedValue(undefined);
  const onReopenJob = vi.fn().mockResolvedValue(undefined);
  const onDuplicate = vi.fn().mockResolvedValue(undefined);
  const onDeleteJob = vi.fn().mockResolvedValue(undefined);

  it("offers Delete Job when the user can delete listings", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 1, title: "Role To Delete" })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
        canDeleteJobs
        onDeleteJob={onDeleteJob}
      />,
    );

    await openOptionsMenu("Role To Delete");
    expect(
      screen.getByRole("menuitem", { name: /delete job/i }),
    ).toBeInTheDocument();
  });

  it("does not offer Delete Job when the user cannot delete listings", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 1, title: "Protected Role" })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
        canDeleteJobs={false}
        onDeleteJob={onDeleteJob}
      />,
    );

    await openOptionsMenu("Protected Role");
    expect(
      screen.queryByRole("menuitem", { name: /delete job/i }),
    ).not.toBeInTheDocument();
  });

  it("removes the listing when delete is confirmed", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 5, title: "Delete Me" })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
        canDeleteJobs
        onDeleteJob={onDeleteJob}
      />,
    );

    const user = await openOptionsMenu("Delete Me");
    await user.click(screen.getByRole("menuitem", { name: /delete job/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(onDeleteJob).toHaveBeenCalledWith(5);
    expect(screen.queryByText("Delete Me")).not.toBeInTheDocument();
  });

  it("leaves the listing when delete is cancelled", async () => {
    render(
      <JobListingTable
        jobs={[createJob({ id: 6, title: "Keep Me" })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
        canDeleteJobs
        onDeleteJob={onDeleteJob}
      />,
    );

    const user = await openOptionsMenu("Keep Me");
    await user.click(screen.getByRole("menuitem", { name: /delete job/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onDeleteJob).not.toHaveBeenCalled();
    expect(screen.getByText("Keep Me")).toBeInTheDocument();
  });

  it("leaves the listing when delete fails", async () => {
    const failingDelete = vi
      .fn()
      .mockRejectedValue(new Error("Failed to delete job"));

    render(
      <JobListingTable
        jobs={[createJob({ id: 7, title: "Failed Delete" })]}
        organizationId={organizationId}
        onCloseJob={onCloseJob}
        onReopenJob={onReopenJob}
        onDuplicate={onDuplicate}
        canDeleteJobs
        onDeleteJob={failingDelete}
      />,
    );

    const user = await openOptionsMenu("Failed Delete");
    await user.click(screen.getByRole("menuitem", { name: /delete job/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(failingDelete).toHaveBeenCalledWith(7);
    expect(screen.getByText("Failed Delete")).toBeInTheDocument();
  });
});
