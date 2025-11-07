"use client";

import { JobCardType } from "@/lib/types";
import { ArrowRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export const JobCard = ({
  positionName,
  posted,
  companyName,
  jobType,
  jobDescription,
  location,
  experienceLevel,
  onJobSelected,
  logoUrl,
}: JobCardType) => {
  return (
    <Card
      className="border-l-accent hover:bg-secondary my-2 cursor-pointer border-l-4 shadow-none transition-colors"
      onClick={onJobSelected}
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary-foreground flex h-10 w-10 items-center justify-center rounded text-xs font-bold">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Employer's company logo"
                  width={64}
                  height={64}
                  className="rounded-2xl object-cover"
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
          <Bookmark className="text-muted-foreground h-5 w-5" />
        </div>
        <h3 className="mb-1 font-semibold">{positionName}</h3>
        <div className="text-secondary-foreground mb-2 text-sm">{location}</div>
        <div className="text-foreground mb-2 text-sm font-semibold">
          {experienceLevel}
        </div>
        <p className="text-secondary-foreground mb-2 line-clamp-3 text-xs">
          {jobDescription}
        </p>
        <div className="text-muted-foreground mb-2 text-xs">
          <span className="font-semibold">Skills:</span> CI/CD, Customer
          retention, Software deployment, Salesforce, E-commerce
        </div>
        <div className="text-muted-foreground text-xs">{posted}</div>
      </CardContent>
    </Card>
  );
};
