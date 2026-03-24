import { render, screen } from "@/test/test-utils";
import type { ReactNode } from "react";
import { OrganizationProvider } from "../../context/organization-context";
import type { OrganizationWithMembers } from "@/lib/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/employer/organizations/1/settings",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock next/dynamic to render content synchronously
vi.mock("next/dynamic", () => ({
  default: () => {
    const LazyComponent = () => {
      return null;
    };
    return LazyComponent;
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
      id: 2,
      organizationId: 1,
      userId: 200,
      role: "member",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      memberName: "Member User",
      memberEmail: "member@test.org",
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
      memberName: "Admin User",
      memberEmail: "admin@test.org",
      memberEmailVerified: true,
      memberStatus: "active",
    },
  ],
};

function createWrapper(currentUserId: number) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <OrganizationProvider
        organization={mockOrganization}
        currentUserId={currentUserId}
      >
        {children}
      </OrganizationProvider>
    );
  };
}

// Lazy import to allow mocks to settle
let SettingsPage: React.ComponentType;

beforeAll(async () => {
  const mod = await import("../page");
  SettingsPage = mod.default;
});

describe("Settings Page", () => {
  it("shows 'Edit Organization' button when user is owner", () => {
    render(<SettingsPage />, { wrapper: createWrapper(100) });

    expect(
      screen.getByRole("link", { name: /edit organization/i }),
    ).toBeInTheDocument();
  });

  it("hides 'Edit Organization' button when user is a member", () => {
    render(<SettingsPage />, { wrapper: createWrapper(200) });

    expect(
      screen.queryByRole("link", { name: /edit organization/i }),
    ).not.toBeInTheDocument();
  });

  it("hides 'Edit Organization' button when user is an admin", () => {
    render(<SettingsPage />, { wrapper: createWrapper(300) });

    expect(
      screen.queryByRole("link", { name: /edit organization/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the Company Settings heading", () => {
    render(<SettingsPage />, { wrapper: createWrapper(100) });

    expect(
      screen.getByRole("heading", { name: /company settings/i }),
    ).toBeInTheDocument();
  });
});
