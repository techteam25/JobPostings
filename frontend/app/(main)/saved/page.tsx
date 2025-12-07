import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BsBookmarkFill } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserSavedJobs } from "@/lib/api";
import { Suspense } from "react";
import {
  SavedJobsGrid,
  SavedJobsGridSkeleton,
} from "@/app/(main)/saved/components/SavedJobsGrid";

export default async function SavedJobsPage() {
  const savedJobs = await getUserSavedJobs();

  if (!savedJobs || savedJobs.data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BsBookmarkFill />
          </EmptyMedia>
          <EmptyTitle>No Saved Jobs</EmptyTitle>
          <EmptyDescription>
            You have not saved any jobs yet. Browse jobs and save your favorites
            to view them here.
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
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<SavedJobsGridSkeleton />}>
          <SavedJobsGrid userSavedJobs={savedJobs} />
        </Suspense>
      </div>
    </div>
  );
}
