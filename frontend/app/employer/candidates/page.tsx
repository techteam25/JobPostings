import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronLeft } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

import { getServerSession } from "@/lib/auth-server";
import { getUserOrganizations } from "@/lib/api/organizations";

import { CandidateSearchTable } from "./components/CandidateSearchTable";

const JOB_POSTING_ROLES = new Set(["owner", "admin", "recruiter"]);

export default async function CandidatesPage() {
  const cookieHeader = (await headers()).get("cookie");
  const session = await getServerSession(cookieHeader);

  if (!session.user) {
    redirect("/sign-in");
  }

  const orgsResponse = await getUserOrganizations();
  const memberships = orgsResponse.success ? orgsResponse.data : [];
  const primaryMembership = memberships.find(
    (m) => m.isActive && JOB_POSTING_ROLES.has(m.role),
  );
  const hasQualifyingMembership = Boolean(primaryMembership);
  const backHref = primaryMembership
    ? `/employer/organizations/${primaryMembership.organizationId}`
    : "/employer/organizations";
  const backLabel = primaryMembership
    ? `Back to ${primaryMembership.organization.name}`
    : "Back to organizations";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <nav aria-label="Breadcrumb">
        <Link
          href={backHref}
          className="text-secondary-foreground hover:text-foreground inline-flex h-5 items-center gap-0.5 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="size-4" />
          {backLabel}
        </Link>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-semibold">
          Find candidates
        </h1>
        <p className="text-muted-foreground text-sm">
          Browse public candidate profiles. Add filters to narrow by skills,
          location, or availability.
        </p>
      </header>

      {hasQualifyingMembership ? (
        <CandidateSearchTable />
      ) : (
        <Empty className="from-muted/50 to-background bg-linear-to-b from-30%">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>No qualifying organization</EmptyTitle>
            <EmptyDescription>
              Candidate search requires an owner, admin, or recruiter role in an
              organization.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/employer/organizations">View my organizations</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </main>
  );
}
