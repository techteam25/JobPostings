"use client";

import { useMemo, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useFetchJobDetails } from "@/app/(main)/hooks/use-fetch-jobs";
import { saveJobForUser, removeSavedJobForUser } from "@/lib/api";
import { useAuthenticationStatus } from "@/hooks/use-authentication-status";

import { Bookmark, Building2, Menu, Briefcase } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

interface JobDetailPanelProps {
  jobId: number | undefined;
}

export const JobDetailPanel = ({ jobId }: JobDetailPanelProps) => {
  const { isAuthenticated } = useAuthenticationStatus();
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const {
    data: jobDetails,
    fetchingJobDetails,
    fetchJobDetailsError,
  } = useFetchJobDetails(jobId);

  const jobData = useMemo(() => {
    if (!jobDetails?.success) return null;
    return jobDetails.data;
  }, [jobDetails]);

  const hasSaved = jobData?.hasSaved ?? false;

  // No job is selected (e.g. the list is empty). The details query is disabled
  // in this case, so react-query reports `isPending` forever and we'd otherwise
  // be stuck on the loading skeleton. Resolve to an explicit empty state.
  const noSelection = jobId === undefined;

  const handleSaveJobChange = () => {
    if (!jobId) return;

    if (!isAuthenticated) {
      toast.info("Sign in to save jobs");
      return;
    }

    startTransition(async () => {
      if (hasSaved) {
        const result = await removeSavedJobForUser(jobId);
        if (!result.success) toast.error("Failed to remove saved job");
      } else {
        const result = await saveJobForUser(jobId);
        if (!result.success) toast.error("Failed to save job");
      }
      await queryClient.invalidateQueries({ queryKey: ["job-details", jobId] });
    });
  };

  if (noSelection) {
    return <JobDetailEmptyState />;
  }

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
            <div className="text-foreground flex size-16 items-center justify-center rounded font-bold">
              <Building2 className="text-muted-foreground mr-2 size-5" />
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
                    onPressedChange={handleSaveJobChange}
                    disabled={isPending}
                    aria-label="Toggle bookmark"
                    size="sm"
                    variant="outline"
                    className="data-[state=on]:[&_svg]:fill-primary data-[state=on]:[&_svg]:stroke-primary hover:[&_svg]:stroke-accent hover:text-accent-foreground size-9 cursor-pointer transition-colors hover:bg-transparent data-[state=on]:bg-transparent [&_svg]:size-5"
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
              className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer"
            >
              <Link href={`/applications/new?jobId=${job.id}`}>Apply Now</Link>
            </Button>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">{job.title || ""}</h1>
        <div className="text-secondary-foreground mb-6">
          {job.city || ""}, {job.state || "" || job.country || ""}
        </div>

        <div className="bg-primary/10 border-border mb-6 rounded-lg border p-6">
          <h2 className="text-foreground mb-2 text-lg font-semibold">
            Is your resume a good match?
          </h2>
          <p className="text-secondary-foreground mb-4 text-sm">
            Use AI to find out how well the skills on your resume fit this job
            description.
          </p>
          <Button className="bg-green-700 text-white hover:bg-green-800">
            ⚡ Upload your resume
          </Button>
        </div>

        {job.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-foreground mb-2 text-lg font-semibold">
              Requested skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="prose max-w-none">
          <p className="text-card-foreground mb-4">{job.description || ""}</p>
        </div>
      </CardContent>
    </Card>
  );
};

function JobDetailEmptyState() {
  return (
    <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Briefcase />
        </EmptyMedia>
        <EmptyTitle>Nothing to show here</EmptyTitle>
        <EmptyDescription>
          There are no jobs to display right now. Once there are listings,
          select one to see its details here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-10 w-auto rounded-xl" />
      <div className="space-y-2">
        <div>
          <Skeleton className="h-4 w-62.5" />
        </div>
        <Skeleton className="h-4 w-auto" />
        <Skeleton className="h-4 w-50" />
      </div>
    </div>
  );
}
