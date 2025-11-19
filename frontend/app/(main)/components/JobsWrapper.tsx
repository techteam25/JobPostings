"use client";

import { useEffect, useState } from "react";

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

const JobsWrapper = () => {
  const { data, error, fetchingJobs } = useFetchJobs();
  const [jobId, setJobId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (data && data.data.length > 0) {
      setJobId(data.data[0].job.id);
    }
  }, [data]);

  const handleJobSelect = (id: number) => {
    setJobId(id);
  };

  if (fetchingJobs) {
    return (
      <main className="mx-auto max-w-7xl px-1 py-4 lg:px-4 lg:py-6">
        <SkeletonCard />
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
            <SortByDropDownButton />
          </div>
          {/*  job list component */}
          <JobsList
            data={data}
            onJobSelected={handleJobSelect}
            selectedId={jobId}
          />
        </div>
        {/*  job detail component */}
        <div className="sticky top-0 hidden h-fit max-h-screen flex-1 pt-6 lg:block">
          <JobDetailPanel jobId={jobId} />
        </div>
      </div>
    </main>
  );
};

export default JobsWrapper;

export function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-full rounded-xl lg:w-[250px]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 lg:w-[250px]" />
        <Skeleton className="h-4 w-3/4 lg:w-[200px]" />
        <Skeleton className="h-4 w-3/4 lg:w-[200px]" />
        <Skeleton className="h-4 w-3/4 lg:w-[200px]" />
      </div>
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
