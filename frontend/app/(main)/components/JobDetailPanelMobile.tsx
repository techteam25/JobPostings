"use client";

import { useState } from "react";
import { BsChevronLeft } from "react-icons/bs";

import { useFetchJobDetails } from "@/app/(main)/hooks/use-fetch-jobs";
import { SkeletonCard } from "@/app/(main)/components/JobsWrapper";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface JobDetailPanelProps {
  jobId: number | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobDetailPanelMobile = ({
  jobId,
  open,
  onOpenChange,
}: JobDetailPanelProps) => {
  const {
    data: jobDetails,
    fetchingJobDetails,
    fetchJobDetailsError,
  } = useFetchJobDetails(jobId);

  if (fetchingJobDetails || !jobDetails) {
    return (
      <div className="overflow-y-auto">
        <SkeletonCard />
      </div>
    );
  }

  if (fetchJobDetailsError || (jobDetails && !jobDetails.success)) {
    return (
      <div className="flex items-start justify-center">
        <p className="text-muted-foreground">Failed to load job details.</p>
      </div>
    );
  }
  const { employer, job } = jobDetails.data;
  return (
    <div className="lg:hidden">
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex h-[95vh] flex-col">
          <DrawerHeader className="flex-shrink-0 p-1 text-left">
            <DrawerTitle>
              <Button
                variant="link"
                onClick={() => onOpenChange(false)}
                className="text-foreground p-0"
              >
                <BsChevronLeft className="mr-1" /> Back to jobs
              </Button>
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Detailed information about the job
            </DrawerDescription>
          </DrawerHeader>
          <div className="bg-muted-foreground/80 mb-2 h-px w-full flex-shrink-0" />
          <div className="flex-1 overflow-y-auto px-4">
            <div className="flex flex-col space-y-2">
              <div>
                <p className="text-base font-medium">{employer?.name}</p>
                <p className="text-muted-foreground text-xs">2.9★</p>
              </div>
              <div>
                <h1 className="text-lg font-bold">{job.title || ""}</h1>
                <p className="text-muted-foreground mb-6 text-sm">
                  {job.city || ""}, {job.state || "" || job.country || ""}
                </p>
              </div>
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6">
                <h2 className="mb-2 text-lg font-semibold">
                  Is your resume a good match?
                </h2>
                <p className="text-secondary-foreground mb-4 text-sm">
                  Use AI to find out how well the skills on your resume fit this
                  job description.
                </p>
                <Button className="bg-green-700 text-white hover:bg-green-800">
                  ⚡ Upload your resume
                </Button>
              </div>
              <div className="prose max-w-none pb-4">
                <p className="mb-4 text-gray-700">{job.description || ""}</p>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
