"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

import { RefreshCcwIcon } from "lucide-react";
import { useFetchJobs } from "@/app/(main)/hooks/use-fetch-jobs";

import { BsInfoCircle } from "react-icons/bs";

import { JobDetailPanel } from "@/app/(main)/components/JobDetailPanel";
import { JobsList } from "@/app/(main)/components/JobsList";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SortByDropDownButton } from "./SortByDropDownButton";
import { JobDetailPanelMobile } from "@/app/(main)/components/JobDetailPanelMobile";
import { SortByMobileButton } from "@/app/(main)/components/SortByMobileButton";
import { PaginatedApiResponse } from "@/lib/types";
import { JobWithEmployer } from "@/schemas/responses/jobs";

interface JobsWrapperProps {
  jobs: PaginatedApiResponse<JobWithEmployer>;
}

const JobsWrapper = ({ jobs }: JobsWrapperProps) => {
  const { data, error, fetchingJobs } = useFetchJobs(jobs);
  const [jobId, setJobId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"Most Relevant" | "Most Recent">(
    "Most Recent",
  );
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (isDesktop && data && data.data.length > 0 && !jobId) {
      setJobId(data.data[0].job.id);
    }
  }, [isDesktop, data, jobId]);

  const open = !isDesktop && !!jobId;

  const handleJobSelect = useCallback((id: number) => {
    setJobId(id);
  }, []);

  const handleOpenChange = useCallback((o: boolean) => {
    if (!o) setJobId(undefined);
  }, []);

  const handleSortChange = useCallback((s: string) => {
    setSortBy(s as "Most Relevant" | "Most Recent");
  }, []);

  if (fetchingJobs) {
    return (
      <main className="mx-auto max-w-7xl px-1 py-4 lg:px-4 lg:py-6">
        <JobsWrapperSkeleton />
      </main>
    );
  }

  if (error || !data || (data && data.data.length === 0)) {
    return <EmptyMuted />;
  }
  return (
    <main className="mx-auto max-w-7xl px-1 py-4 lg:px-4 lg:py-6">
      <div className="flex gap-4">
        {/* Job Listings Sidebar */}
        <div className="w-full space-y-1.5 lg:w-[28rem]">
          {/* Total results found in location, sort results dropdown */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-secondary-foreground mr-4 truncate text-sm text-ellipsis">
              216 Back end engineer jobs in Plano, TX in Plano, TX
            </div>
            <SortByMobileButton
              defaultSort={sortBy}
              onSortChange={handleSortChange}
            />
            <SortByDropDownButton />
          </div>
          {/*  job list component */}
          <Suspense fallback={<JobsListSkeleton />}>
            <JobsList
              data={data.data}
              onJobSelected={handleJobSelect}
              selectedId={jobId}
            />
          </Suspense>
        </div>
        {/*  job detail component */}
        <JobDetailPanelMobile
          jobId={jobId}
          open={open}
          onOpenChange={handleOpenChange}
        />
        <div className="sticky top-0 hidden h-fit max-h-screen flex-1 pt-6 lg:block">
          <Suspense fallback={<JobDetailPanelSkeleton />}>
            <JobDetailPanel jobId={jobId} />
          </Suspense>
        </div>
      </div>
    </main>
  );
};

export default JobsWrapper;

export function JobsListSkeleton() {
  return (
    <div className="w-full space-y-4 lg:w-[28rem]">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Multiple job card skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-card flex items-start gap-3 rounded-lg border p-4"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-1 h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function JobDetailPanelSkeleton() {
  return (
    <div className="sticky top-0 hidden h-fit flex-1 pt-6 lg:block">
      <div className="max-h-screen overflow-y-auto rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>

        <Skeleton className="mb-2 h-8 w-2/3" />
        <Skeleton className="mb-6 h-4 w-1/3" />

        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6">
          <Skeleton className="mb-3 h-5 w-1/3" />
          <Skeleton className="mb-4 h-4 w-3/4" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="prose max-w-none space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function JobsWrapperSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex gap-4">{/* Detail panel (desktop) */}</div>
    </div>
  );
}

export function EmptyMuted() {
  return (
    <Empty className="from-muted/50 to-background h-full bg-gradient-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BsInfoCircle />
        </EmptyMedia>
        <EmptyTitle>No Jobs Posted</EmptyTitle>
        <EmptyDescription>
          No Job Posts found. Please check back later.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          <RefreshCcwIcon />
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  );
}
