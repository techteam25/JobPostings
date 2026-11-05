import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationProvider } from "../../../../context/organization-context";
import { DangerZone } from "../DangerZone";
import type { OrganizationWithMembers } from "@/lib/types";
import { toast } from "sonner";

const { mockPush, mockDelete, mockTransferOwnership } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockDelete: vi.fn().mockResolvedValue({ data: { success: true } }),
  mockTransferOwnership: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock("@/lib/axios-instance", () => ({
  instance: {
    delete: mockDelete,
  },
}));

vi.mock("@/app/employer/organizations/hooks/use-transfer-ownership", () => ({
  useTransferOwnership: () => ({
    mutateAsync: mockTransferOwnership,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockOrganization: OrganizationWithMembers = {
  id: 1,
  name: "Test Organization",
  streetAddress: "123 Main St",
  city: "Test City",
  state: "TS",
  country: "Testland",
  zipCode: "12345",
  phone: "1234567890",
  url: "https://test.org",
  logoUrl: null,
  mission: "Test mission",
  subscriptionTier: "free",
  subscriptionStatus: "active",
  subscriptionStartDate: null,
  subscriptionEndDate: null,
  jobPostingLimit: null,
  status: "active",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  members: [
    {
      id: 1,
      organizationId: 1,
      userId: 100,
      role: "owner",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      memberName: "Owner User",
      memberEmail: "owner@test.org",
      memberEmailVerified: true,
      memberStatus: "active",
    },
    {
      id: 3,
      organizationId: 1,
      userId: 300,
      role: "admin",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      memberName: "Ada Admin",
      memberEmail: "ada@test.org",
      memberEmailVerified: true,
      memberStatus: "active",
    },
  ],
};

function createWrapper(organization = mockOrganization) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <OrganizationProvider organization={organization} currentUserId={100}>
          {children}
        </OrganizationProvider>
      </QueryClientProvider>
    );
  };
}

describe("DangerZone", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockDelete.mockClear();
    mockTransferOwnership.mockClear();
    mockTransferOwnership.mockResolvedValue(undefined);
    vi.mocked(toast.success).mockClear();
  });

  it("renders the danger zone section", () => {
    render(<DangerZone />, { wrapper: createWrapper() });

    expect(
      screen.getByRole("heading", { name: /danger zone/i }),
    ).toBeInTheDocument();
  });

  it("opens delete dialog when button is clicked", async () => {
    const user = userEvent.setup();
    render(<DangerZone />, { wrapper: createWrapper() });

    await user.click(
      screen.getByRole("button", { name: /delete organization/i }),
    );

    expect(
      screen.getByText(/this action cannot be undone/i),
    ).toBeInTheDocument();
  });

  it("keeps confirm button disabled when org name is not typed", async () => {
    const user = userEvent.setup();
    render(<DangerZone />, { wrapper: createWrapper() });

    await user.click(
      screen.getByRole("button", { name: /delete organization/i }),
    );

    const confirmButton = screen.getAllByRole("button", {
      name: /delete organization/i,
    });
    const dialogConfirmButton = confirmButton[confirmButton.length - 1];
    expect(dialogConfirmButton).toBeDisabled();
  });

  it("keeps confirm button disabled when wrong name is typed", async () => {
    const user = userEvent.setup();
    render(<DangerZone />, { wrapper: createWrapper() });

    await user.click(
      screen.getByRole("button", { name: /delete organization/i }),
    );

    const input = screen.getByPlaceholderText("Test Organization");
    await user.type(input, "Wrong Name");

    const confirmButton = screen.getAllByRole("button", {
      name: /delete organization/i,
    });
    const dialogConfirmButton = confirmButton[confirmButton.length - 1];
    expect(dialogConfirmButton).toBeDisabled();
  });

  it("enables confirm button when correct org name is typed", async () => {
    const user = userEvent.setup();
    render(<DangerZone />, { wrapper: createWrapper() });

    await user.click(
      screen.getByRole("button", { name: /delete organization/i }),
    );

    const input = screen.getByPlaceholderText("Test Organization");
    await user.type(input, "Test Organization");

    const confirmButton = screen.getAllByRole("button", {
      name: /delete organization/i,
    });
    const dialogConfirmButton = confirmButton[confirmButton.length - 1];
    expect(dialogConfirmButton).toBeEnabled();
  });

  it("opens transfer from Danger Zone and lands on members after success", async () => {
    const user = userEvent.setup();
    render(<DangerZone />, { wrapper: createWrapper() });

    expect(
      screen.getByRole("button", { name: /delete organization/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /transfer ownership/i }),
    );

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /ada admin/i }));
    await user.click(
      within(dialog).getByRole("button", { name: /^transfer ownership$/i }),
    );

    await waitFor(() => {
      expect(mockTransferOwnership).toHaveBeenCalledWith(3);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/employer/organizations/1/settings?tab=members",
      );
    });
  });

  it("disables transfer with invite copy when no eligible admin exists", () => {
    const soloOrg: OrganizationWithMembers = {
      ...mockOrganization,
      members: [mockOrganization.members[0]!],
    };

    render(<DangerZone />, { wrapper: createWrapper(soloOrg) });

    expect(
      screen.getByRole("button", { name: /transfer ownership/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        /invite someone, make them an admin, then transfer — or delete the organization/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete organization/i }),
    ).toBeInTheDocument();
  });
});
