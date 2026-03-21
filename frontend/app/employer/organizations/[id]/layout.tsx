import { ReactNode } from "react";
import { getOrganizationAction } from "./actions/getOrganizationAction";
import { LayoutClient } from "./components/LayoutClient";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CircleOff } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { id } = await params;

  const result = await getOrganizationAction(Number(id));

  if (!result.success) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleOff />
          </EmptyMedia>
          <EmptyTitle>No organization</EmptyTitle>
          <EmptyDescription>No organization found</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p>No organization information found</p>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <LayoutClient
      organizationId={result.data.id}
      organizationName={result.data.name}
      organizationLogoUrl={result.data.logoUrl}
    >
      {children}
    </LayoutClient>
  );
}
