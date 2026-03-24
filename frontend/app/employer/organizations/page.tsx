import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Plus, TriangleAlert } from "lucide-react";

import { getUserOrganizations } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import OrgPicker from "./components/org-picker";

export default async function EmployerOrganizationsPage() {
  const result = await getUserOrganizations();

  if (!result.success || !result.data) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert />
          </EmptyMedia>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>
            We couldn&apos;t load your organizations. Please try again later.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (result.data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building2 />
          </EmptyMedia>
          <EmptyTitle>No Organizations</EmptyTitle>
          <EmptyDescription>
            You don&apos;t have any organizations yet. Create one to get
            started.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/employer/organizations/new">
            <Button className="cursor-pointer">
              <Plus data-icon="inline-start" />
              Create Organization
            </Button>
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  if (result.data.length === 1) {
    redirect(`/employer/organizations/${result.data[0].organizationId}`);
  }

  return <OrgPicker organizations={result.data} />;
}
