import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@/test/test-utils";
import type { Job } from "@/schemas/responses/jobs";
import { JobListingTable } from "../JobListingTable";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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

describe("JobListingTable reopen action", () => {
  const organizationId = 10;
  const onCloseJob = vi.fn().mockResolvedValue(undefined);
  const onReopenJob = vi.fn().mockResolvedValue(undefined);
  const onDuplicate = vi.fn().mockResolvedValue(undefined);

  async function openOptionsMenu(jobTitle: string) {
    const user = userEvent.setup();
    const row = screen.getByText(jobTitle).closest("tr");
    if (!row) throw new Error(`Row not found for job: ${jobTitle}`);

    await user.click(within(row).getByRole("button", { name: /options/i }));
    return user;
  }

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

    expect(onReopenJob).toHaveBeenCalledWith(42);
  });
});
