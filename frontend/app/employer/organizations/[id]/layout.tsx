import { ReactNode } from "react";
import { getOrganizationAction } from "./actions/getOrganizationAction";
import { LayoutClient } from "./components/LayoutClient";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { id } = await params;
  
  const organization = await getOrganizationAction(Number(id));

  if (!organization) {
    return <div className="p-4">Error: Organization not found.</div>;
  }

  return (
    <LayoutClient
      organizationName={organization.name}
      organizationLogoUrl={organization.logoUrl}
    >
      {children}
    </LayoutClient>
  );
}
