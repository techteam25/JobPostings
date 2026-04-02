"use client";

import { memo, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { JobTypeEnum } from "@/lib/types";
import { saveJobForUser, removeSavedJobForUser } from "@/lib/api";
import { useAuthenticationStatus } from "@/hooks/use-authentication-status";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Toggle } from "./ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Bookmark, Building2 } from "lucide-react";

interface JobCardType {
  jobId: number;
  positionName: string;
  companyName: string;
  location: string;
  jobType: JobTypeEnum;
  experienceLevel: string;
  posted: string;
  jobDescription: string;
  logoUrl: string | null;
  onJobSelected: () => void;
  isSelected: boolean;
  hasSaved?: boolean;
}

export const JobCard = memo(
  ({
    jobId,
    positionName,
    posted,
    companyName,
    jobType,
    jobDescription,
    location,
    experienceLevel,
    onJobSelected,
    isSelected,
    hasSaved = false,
  }: JobCardType) => {
    const { isAuthenticated } = useAuthenticationStatus();
    const [isPending, startTransition] = useTransition();
    const queryClient = useQueryClient();

    const handleSaveJobChange = () => {
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
        await queryClient.invalidateQueries({
          queryKey: ["job-details", jobId],
        });
      });
    };

    return (
      <Card
        className={cn(
          "border-l-border bg-background hover:bg-card my-2 cursor-pointer border-l-2 shadow-none transition-colors",
          isSelected && "border-accent border-2",
        )}
        onClick={onJobSelected}
      >
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="text -foreground flex size-8 items-center justify-center rounded text-xs font-bold md:h-10 md:w-10">
                <Building2 className="text-muted-foreground mr-2 size-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{companyName}</div>
                <div className="text-muted-foreground text-xs">{jobType}</div>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    pressed={hasSaved}
                    onPressedChange={handleSaveJobChange}
                    disabled={isPending}
                    aria-label="Toggle bookmark"
                    size="sm"
                    variant="outline"
                    className="data-[state=on]:[&_svg]:fill-primary data-[state=on]:[&_svg]:stroke-primary hover:[&_svg]:stroke-accent hover:text-accent-foreground cursor-pointer border-0 transition-colors hover:bg-transparent data-[state=on]:bg-transparent [&_svg]:size-5"
                  >
                    <Bookmark className="text-muted-foreground" />
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-foreground text-primary-foreground border-input border">
                <p>Save this job</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <h3 className="mb-1 text-sm font-semibold sm:text-base md:text-lg">
            {positionName}
          </h3>
          <div className="text-secondary-foreground mb-2 text-xs sm:text-sm">
            {location}
          </div>
          <div className="text-foreground mb-2 text-xs font-semibold sm:text-sm">
            {experienceLevel}
          </div>
          <p className="text-secondary-foreground mb-2 line-clamp-2 text-xs md:line-clamp-3">
            {jobDescription}
          </p>
          <div className="text-muted-foreground mb-2 hidden text-xs md:block">
            <span className="font-semibold">Skills:</span> CI/CD, Customer
            retention, Software deployment, Salesforce, E-commerce
          </div>
          <div className="text-muted-foreground text-xs">{posted}</div>
        </CardContent>
      </Card>
    );
  },
);

JobCard.displayName = "JobCard";
