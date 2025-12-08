import { PaginatedApiResponse, SavedJob } from "@/lib/types";
import { SavedJobCard } from "@/app/(main)/saved/components/SavedJobCard";

import { Skeleton } from "@/components/ui/skeleton";

interface SavedJobsGridProps {
  userSavedJobs: PaginatedApiResponse<SavedJob>;
}
export const SavedJobsGrid = ({ userSavedJobs }: SavedJobsGridProps) => {
  const { data: savedJobs } = userSavedJobs;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {savedJobs.map((savedJob) => (
        <SavedJobCard savedJob={savedJob} key={savedJob.id} />
      ))}
    </div>
  );
};

export function SavedJobsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-lg bg-white p-4 shadow-sm"
        >
          {/* Card Header */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <div className="mt-2">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          {/* Card Content */}
          <div className="mb-4 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>

          {/* Card Footer */}
          <div className="mt-auto">
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
