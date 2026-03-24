import { renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import {
  OrganizationProvider,
  useOrganization,
  useIsOwner,
} from "../organization-context";
import type { OrganizationWithMembers } from "@/lib/types";

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

function createWrapper(
  organization: OrganizationWithMembers,
  currentUserId: number,
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <OrganizationProvider
        organization={organization}
        currentUserId={currentUserId}
      >
        {children}
      </OrganizationProvider>
    );
  };
}

describe("OrganizationContext", () => {
  describe("useOrganization", () => {
    it("throws when used outside OrganizationProvider", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useOrganization());
      }).toThrow("useOrganization must be used within an OrganizationProvider");

      consoleSpy.mockRestore();
    });

    it("returns the full organization object", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrganization, 100),
      });

      expect(result.current.organization).toEqual(mockOrganization);
    });

    it("computes currentUserRole as owner when userId matches owner member", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrganization, 100),
      });

      expect(result.current.currentUserRole).toBe("owner");
    });

    it("computes currentUserRole as member when userId matches member", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrganization, 200),
      });

      expect(result.current.currentUserRole).toBe("member");
    });

    it("computes currentUserRole as admin when userId matches admin member", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrganization, 300),
      });

      expect(result.current.currentUserRole).toBe("admin");
    });

    it("defaults currentUserRole to member when userId not found in members", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrganization, 999),
      });

      expect(result.current.currentUserRole).toBe("member");
    });

    it("exposes currentUserId", () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: createWrapper(mockOrganization, 100),
      });

      expect(result.current.currentUserId).toBe(100);
    });
  });

  describe("useIsOwner", () => {
    it("returns true when current user is owner", () => {
      const { result } = renderHook(() => useIsOwner(), {
        wrapper: createWrapper(mockOrganization, 100),
      });

      expect(result.current).toBe(true);
    });

    it("returns false when current user is member", () => {
      const { result } = renderHook(() => useIsOwner(), {
        wrapper: createWrapper(mockOrganization, 200),
      });

      expect(result.current).toBe(false);
    });

    it("returns false when current user is admin", () => {
      const { result } = renderHook(() => useIsOwner(), {
        wrapper: createWrapper(mockOrganization, 300),
      });

      expect(result.current).toBe(false);
    });
  });
});
