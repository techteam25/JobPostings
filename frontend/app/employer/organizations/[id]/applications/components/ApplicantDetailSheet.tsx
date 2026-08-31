"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getApplicationStatusLabel } from "@/lib/application-status";
import { formatToReadableDate } from "@/lib/utils";
import type { OrganizationJobApplications } from "@/lib/types";
import { ExternalLink, FileText } from "lucide-react";

interface ApplicantDetailSheetProps {
  application: OrganizationJobApplications | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicantDetailSheet({
  application,
  open,
  onOpenChange,
}: ApplicantDetailSheetProps) {
  if (!application) {
    return null;
  }

  const statusLabel = getApplicationStatusLabel(application.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{application.applicantName}</SheetTitle>
          <SheetDescription>{application.applicantEmail}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Status</span>
            <Badge variant="secondary">{statusLabel}</Badge>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <p>
              <span className="font-medium">Applied:</span>{" "}
              {formatToReadableDate(application.appliedAt)}
            </p>
            {application.reviewedAt && (
              <p>
                <span className="font-medium">Reviewed:</span>{" "}
                {formatToReadableDate(application.reviewedAt)}
              </p>
            )}
          </div>

          <Separator />

          <section className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4" />
              Cover Letter
            </h3>
            {application.coverLetter ? (
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {application.coverLetter}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Cover letter not provided
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Resume</h3>
            {application.resumeUrl ? (
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
              >
                View resume
                <ExternalLink className="size-3.5" />
              </a>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Resume not provided
              </p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
