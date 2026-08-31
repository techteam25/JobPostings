"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  getApplicationStatusLabel,
  getEmployerAllowedTransitions,
  type ApplicationStatus,
} from "@/lib/application-status";
import { formatToReadableDate } from "@/lib/utils";
import type { OrganizationJobApplications } from "@/lib/types";
import { ExternalLink, FileText, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApplicationNotes } from "../hooks/useApplicationNotes";
import { useUpdateApplicationStatus } from "../hooks/useUpdateApplicationStatus";

interface ApplicantDetailSheetProps {
  application: OrganizationJobApplications | null;
  organizationId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (application: OrganizationJobApplications) => void;
}

export function ApplicantDetailSheet({
  application,
  organizationId,
  open,
  onOpenChange,
  onStatusChange,
}: ApplicantDetailSheetProps) {
  const [draftNote, setDraftNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutateAsync: updateStatus, isPending: isStatusUpdatePending } =
    useUpdateApplicationStatus(organizationId);

  const { notesQuery, addNoteMutation } = useApplicationNotes({
    organizationId: application?.organizationId ?? organizationId,
    jobId: application?.jobId ?? 0,
    applicationId: application?.applicationId ?? 0,
    enabled: open && application !== null,
  });

  if (!application) {
    return null;
  }

  const statusLabel = getApplicationStatusLabel(application.status);
  const allowedTransitions = getEmployerAllowedTransitions(
    application.status as ApplicationStatus,
  );
  const notes = notesQuery.data ?? [];

  const handleStatusMove = async (nextStatus: ApplicationStatus) => {
    try {
      await updateStatus({
        jobId: application.jobId,
        applicationId: application.applicationId,
        status: nextStatus,
      });

      onStatusChange({ ...application, status: nextStatus });
      toast.success(
        `Application moved to ${getApplicationStatusLabel(nextStatus)}`,
      );
    } catch {
      // Error toast is handled in the mutation hook.
    }
  };

  const handleAddNote = async () => {
    const trimmed = draftNote.trim();
    if (!trimmed) {
      setValidationError("Note cannot be empty");
      return;
    }

    setValidationError(null);
    try {
      await addNoteMutation.mutateAsync(trimmed);
      setDraftNote("");
    } catch {
      // Error toast is handled in the mutation; notes list stays unchanged.
    }
  };

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

          {allowedTransitions.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Move application</h3>
              <div className="flex flex-wrap gap-2">
                {allowedTransitions.map((nextStatus) => {
                  const nextLabel = getApplicationStatusLabel(nextStatus);
                  const isReject = nextStatus === "rejected";

                  return (
                    <Button
                      key={nextStatus}
                      type="button"
                      size="sm"
                      variant={isReject ? "destructive" : "default"}
                      disabled={isStatusUpdatePending}
                      aria-label={`Move to ${nextLabel}`}
                      onClick={() => handleStatusMove(nextStatus)}
                    >
                      {isStatusUpdatePending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        nextLabel
                      )}
                    </Button>
                  );
                })}
              </div>
            </section>
          )}

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

          <Separator />

          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="size-4" />
              Internal Notes
            </h3>

            {notesQuery.isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Loading notes...
              </div>
            ) : notesQuery.isError ? (
              <p className="text-destructive text-sm">
                Failed to load notes. Please try again.
              </p>
            ) : notes.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">
                No internal notes yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notes.map((entry, index) => (
                  <li
                    key={`${entry.createdAt}-${index}`}
                    className="bg-muted/50 rounded-md p-3"
                  >
                    <p className="text-sm whitespace-pre-wrap">{entry.note}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatToReadableDate(new Date(entry.createdAt))}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2">
              <Textarea
                value={draftNote}
                onChange={(event) => {
                  setDraftNote(event.target.value);
                  if (validationError) {
                    setValidationError(null);
                  }
                }}
                placeholder="Add an internal note..."
                rows={3}
                aria-label="Internal note"
              />
              {validationError && (
                <p className="text-destructive text-sm">{validationError}</p>
              )}
              <Button
                type="button"
                size="sm"
                className="self-end"
                disabled={addNoteMutation.isPending}
                onClick={handleAddNote}
              >
                {addNoteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add note"
                )}
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
