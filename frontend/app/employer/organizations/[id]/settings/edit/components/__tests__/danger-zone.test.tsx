import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationProvider } from "../../../../context/organization-context";
import { DangerZone } from "../DangerZone";
import type { OrganizationWithMembers } from "@/lib/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock axios instance
vi.mock("@/lib/axios-instance", () => ({
  instance: {
    delete: vi.fn(() => Promise.resolve({ data: { success: true } })),
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
  ],
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider organization={mockOrganization} currentUserId={100}>
        {children}
      </OrganizationProvider>
    </QueryClientProvider>
  );
}

describe("DangerZone", () => {
  it("renders the danger zone section", () => {
    render(<DangerZone />, { wrapper: Wrapper });

    expect(
      screen.getByRole("heading", { name: /danger zone/i }),
    ).toBeInTheDocument();
  });

  it("opens delete dialog when button is clicked", async () => {
    const user = userEvent.setup();
    render(<DangerZone />, { wrapper: Wrapper });

    await user.click(
      screen.getByRole("button", { name: /delete organization/i }),
    );

    expect(
      screen.getByText(/this action cannot be undone/i),
    ).toBeInTheDocument();
  });

  it("keeps confirm button disabled when org name is not typed", async () => {
    const user = userEvent.setup();
    render(<DangerZone />, { wrapper: Wrapper });

    await user.click(
      screen.getByRole("button", { name: /delete organization/i }),
    );

    const confirmButton = screen.getAllByRole("button", {
      name: /delete organization/i,
    });
    // The confirm button in the dialog (the second one)
    const dialogConfirmButton = confirmButton[confirmButton.length - 1];
    expect(dialogConfirmButton).toBeDisabled();
  });

  it("keeps confirm button disabled when wrong name is typed", async () => {
    const user = userEvent.setup();
    render(<DangerZone />, { wrapper: Wrapper });

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
    render(<DangerZone />, { wrapper: Wrapper });

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
});
