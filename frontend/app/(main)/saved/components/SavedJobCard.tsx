"use client";

import { memo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { SavedJob } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Bookmark, Building2 } from "lucide-react";
import { formatToRelativeDate } from "@/lib/utils";
import { useUnsaveJobMutation } from "@/hooks/use-saved-jobs";

interface SavedJobCardProps {
  savedJob: SavedJob;
}

export const SavedJobCard = memo(function SavedJobCard({
  savedJob,
}: SavedJobCardProps) {
  const unsaveJob = useUnsaveJobMutation();

  const handleRemove = useCallback(() => {
    unsaveJob.mutate(savedJob.job.id);
  }, [savedJob.job.id, unsaveJob]);
  return (
    <Card className="group overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center justify-start">
            <div className="flex size-8 flex-shrink-0 justify-center rounded-full">
              <Building2 className="text-muted-foreground mr-2 size-5" />
            </div>
            <span className="text-secondary-foreground line-clamp-1 text-sm text-ellipsis">
              {savedJob.job.employer.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary-foreground hover:text-foreground cursor-pointer hover:bg-transparent"
            onClick={handleRemove}
          >
            <Bookmark />
          </Button>
        </div>

        {/* Title & Location */}
        <h3 className="text-foreground mb-2 text-lg leading-tight font-semibold">
          {savedJob.job.title}
        </h3>
        <p className="text-secondary-foreground mb-3 text-sm font-medium">
          {savedJob.job.city}
          {savedJob.job.state ? <span>, {savedJob.job.state}</span> : null}
          {!savedJob.job.state && savedJob.job.country ? (
            <span>, {savedJob.job.country}</span>
          ) : null}
        </p>
        <div className="mb-4 space-y-2">
          {savedJob.savedAt && (
            <div className="flex items-center gap-2">
              <span className="text-secondary-foreground text-xs font-medium">
                Saved {formatToRelativeDate(new Date(savedJob.savedAt))}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          {savedJob.isExpired || savedJob.isClosed ? (
            <Button
              className="bg-muted text-secondary-foreground hover:bg-muted w-full"
              disabled
            >
              Job Closed
            </Button>
          ) : (
            <Button className="bg-primary/90 text-primary-foreground hover:bg-primary w-full cursor-pointer">
              View Job Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});
SavedJobCard.displayName = "SavedJobCard";
