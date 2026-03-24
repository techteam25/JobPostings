"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Member, OrganizationWithMembers } from "@/lib/types";

interface OrganizationContextValue {
  organization: OrganizationWithMembers;
  currentUserRole: Member["role"];
  currentUserId: number;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null,
);

interface OrganizationProviderProps {
  organization: OrganizationWithMembers;
  currentUserId: number;
  children: ReactNode;
}

export function OrganizationProvider({
  organization,
  currentUserId,
  children,
}: OrganizationProviderProps) {
  const value = useMemo(() => {
    const member = organization.members.find((m) => m.userId === currentUserId);
    const currentUserRole: Member["role"] = member?.role ?? "member";

    return { organization, currentUserRole, currentUserId };
  }, [organization, currentUserId]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
}

export function useIsOwner(): boolean {
  const { currentUserRole } = useOrganization();
  return currentUserRole === "owner";
}
