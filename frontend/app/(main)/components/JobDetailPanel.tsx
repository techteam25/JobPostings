"use client";

import { useMemo } from "react";
import { Bookmark, Menu } from "lucide-react";

import { useFetchJobDetails } from "@/app/(main)/hooks/use-fetch-jobs";
import { useJobSaved } from "@/hooks/use-job-saved";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImOffice } from "react-icons/im";
import Link from "next/link";

interface JobDetailPanelProps {
  jobId: number | undefined;
}

export const JobDetailPanel = ({ jobId }: JobDetailPanelProps) => {
  const {
    data: jobDetails,
    fetchingJobDetails,
    fetchJobDetailsError,
  } = useFetchJobDetails(jobId);

  const { hasSaved, toggleSaved } = useJobSaved(jobId);

  const jobData = useMemo(() => {
    if (!jobDetails?.success) return null;
    return jobDetails.data;
  }, [jobDetails]);

  if (fetchingJobDetails || !jobDetails) {
    return (
      <div className="overflow-y-auto">
        <SkeletonCard />
      </div>
    );
  }

  if (fetchJobDetailsError || !jobData) {
    return (
      <div className="flex items-start justify-center">
        <p className="text-muted-foreground">Failed to load job details.</p>
      </div>
    );
  }

  const { employer, job } = jobData;
  return (
    <Card className="max-h-screen overflow-y-auto">
      <CardContent className="max-h-screen p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary-foreground flex size-16 items-center justify-center rounded font-bold">
              <ImOffice className="text-muted-foreground mr-2 size-5" />
            </div>
            <div>
              <div className="font-semibold">{employer?.name}</div>
              <div className="text-muted-foreground text-sm">2.9★</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Toggle
                    pressed={hasSaved}
                    onPressedChange={toggleSaved}
                    aria-label="Toggle bookmark"
                    size="sm"
                    variant="outline"
                    className="data-[state=on]:*:[svg]:fill-accent data-[state=on]:*:[svg]:stroke-accent hover:*:[svg]:stroke-accent hover:text-accent-foreground size-9 cursor-pointer transition-colors hover:bg-transparent data-[state=on]:bg-transparent [&_svg]:size-5"
                  >
                    <Bookmark className="text-muted-foreground" />
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-foreground text-primary-foreground border-input border">
                <p>Save this job</p>
              </TooltipContent>
            </Tooltip>
            <Button
              asChild
              className="bg-foreground text-primary-foreground hover:bg-foreground/95 cursor-pointer"
            >
              <Link href={`/applications/new?jobId=${job.id}`}>Apply Now</Link>
            </Button>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">{job.title || ""}</h1>
        <div className="text-secondary-foreground mb-6">
          {job.city || ""}, {job.state || "" || job.country || ""}
        </div>

        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="mb-2 text-lg font-semibold">
            Is your resume a good match?
          </h2>
          <p className="mb-4 text-sm text-gray-700">
            Use AI to find out how well the skills on your resume fit this job
            description.
          </p>
          <Button className="bg-green-700 text-white hover:bg-green-800">
            ⚡ Upload your resume
          </Button>
        </div>

        <div className="prose max-w-none">
          <p className="mb-4 text-gray-700">{job.description || ""}</p>
        </div>
      </CardContent>
    </Card>
  );
};

function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[40px] w-auto rounded-xl" />
      <div className="space-y-2">
        <div>
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <Skeleton className="h-4 w-auto" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}
