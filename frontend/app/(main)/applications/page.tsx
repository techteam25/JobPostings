import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TbFileStack } from "react-icons/tb";
import MyApplications, {
  MyApplicationsSkeleton,
} from "@/app/(main)/applications/components/MyApplications";
import { getAllApplicationsByUser } from "@/lib/api";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default async function MyApplicationsPage() {
  const applications = await getAllApplicationsByUser();

  if (!applications || applications.data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TbFileStack />
          </EmptyMedia>
          <EmptyTitle>No job applications</EmptyTitle>
          <EmptyDescription>
            You have not applied to any jobs yet. Browse jobs and submit your
            applications to see them listed here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/">Browse Jobs</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Suspense fallback={<MyApplicationsSkeleton />}>
      <MyApplications applications={applications} />
    </Suspense>
  );
}
