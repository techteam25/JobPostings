import { ReactNode } from "react";
import { headers } from "next/headers";
import { getOrganizationAction } from "./actions/getOrganizationAction";
import { getServerSession } from "@/lib/auth-server";
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

  const headerStore = await headers();
  const session = await getServerSession(headerStore.get("cookie"));
  const currentUserId = session.user?.id ? parseInt(session.user.id) : 0;

  return (
    <LayoutClient organization={result.data} currentUserId={currentUserId}>
      {children}
    </LayoutClient>
  );
}
