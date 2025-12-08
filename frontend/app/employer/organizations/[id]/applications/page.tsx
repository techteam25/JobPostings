import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CircleOff } from "lucide-react";
import { getAllJobsApplicationsForOrganization } from "@/lib/api";
import { JobApplicationListing } from "@/app/employer/organizations/[id]/applications/components/JobApplicationListing";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationJobApplicationsPage({
  params,
}: PageProps) {
  const { id } = await params;
  const receivedApplications = await getAllJobsApplicationsForOrganization(id);

  if (!receivedApplications || receivedApplications.data.length === 0) {
    return (
      <Empty className="mx-auto w-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleOff />
          </EmptyMedia>
          <EmptyTitle>No Jobs Applications received</EmptyTitle>
          <EmptyDescription></EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p>
            There are currently no job applications received for jobs under this
            organization.
          </p>
          <p>Check back later.</p>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="mx-auto w-full">
      <JobApplicationListing applications={receivedApplications} />
    </div>
  );
}
