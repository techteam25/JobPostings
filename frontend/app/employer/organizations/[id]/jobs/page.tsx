import dynamic from "next/dynamic";
import { getOrganizationJobsList } from "@/lib/api";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CircleOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobListingsSectionSkeleton } from "@/app/employer/organizations/[id]/components/JobListingInformation";
import Link from "next/link";

const JobListingsSection = dynamic(
  () =>
    import(
      "@/app/employer/organizations/[id]/components/JobListingInformation"
    ).then((mod) => ({ default: mod.JobListingsSection })),
  {
    loading: () => <JobListingsSectionSkeleton />,
  },
);

interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function OrganizationJobsPage({ params }: PageProps) {
  const { id } = await params;
  const organizationJobsList = await getOrganizationJobsList(Number(id));

  if (!organizationJobsList.success || organizationJobsList.data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleOff />
          </EmptyMedia>
          <EmptyTitle>No Jobs Posted</EmptyTitle>
          <EmptyDescription>
            No jobs found for this organization
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p>There are currently no jobs posted under this organization.</p>
          <Link href={`/employer/organizations/${id}/jobs/new`}>
            <Button className="bg-primary/90 hover:bg-primary cursor-pointer [&_svg]:size-4">
              <Plus className="mr-1" />
              Post new job
            </Button>
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <JobListingsSection
      jobsList={organizationJobsList}
      organizationId={Number(id)}
    />
  );
}
