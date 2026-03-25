import { render, screen } from "@/test/test-utils";
import type { ReactNode } from "react";
import { OrganizationProvider } from "../../context/organization-context";
import { mockOrganization } from "@/test/fixtures/mockOrganization.fixture";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/employer/organizations/1/settings",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock next/dynamic to render content synchronously
vi.mock("next/dynamic", () => ({
  default: () => {
    return () => {
      return null;
    };
  },
}));

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
