"use client";

import { memo } from "react";
import { JobType } from "@/lib/types";
import { Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Toggle } from "./ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JobCardType {
  positionName: string;
  companyName: string;
  location: string;
  jobType: JobType;
  experienceLevel: string;
  posted: string;
  jobDescription: string;
  logoUrl: string | null;
  onJobSelected: () => void;
  isSelected: boolean;
}

export const JobCard = memo(({
  positionName,
  posted,
  companyName,
  jobType,
  jobDescription,
  location,
  experienceLevel,
  onJobSelected,
  logoUrl,
  isSelected,
}: JobCardType) => {
  return (
    <Card
      className={cn(
        "border-l-border hover:bg-secondary my-2 cursor-pointer border-l-2 shadow-none transition-colors",
        isSelected && "border-accent border-2",
      )}
      onClick={onJobSelected}
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary-foreground flex size-8 items-center justify-center rounded text-xs font-bold md:h-10 md:w-10">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Employer's company logo"
                  width={64}
                  height={64}
                  className="rounded-2xl object-cover"
                  sizes="(max-width: 768px) 32px, 40px"
                />
              ) : (
                <span>name.charAt(0)</span>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold">{companyName}</div>
              <div className="text-muted-foreground text-xs">{jobType}</div>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Toggle
                  aria-label="Toggle bookmark"
                  size="sm"
                  variant="outline"
                  className="data-[state=on]:*:[svg]:fill-accent data-[state=on]:*:[svg]:stroke-accent hover:*:[svg]:stroke-accent hover:text-accent-foreground cursor-pointer border-0 transition-colors hover:bg-transparent data-[state=on]:bg-transparent [&_svg]:size-5"
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
});

JobCard.displayName = "JobCard";
