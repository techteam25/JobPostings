"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { Job } from "@/schemas/responses/jobs";

interface DeleteJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isPending?: boolean;
}

export function DeleteJobDialog({
  job,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: DeleteJobDialogProps) {
  if (!job) return null;

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Job Listing"
      description={
        <>
          Are you sure you want to delete &ldquo;{job.title}&rdquo;? This action
          cannot be undone and the listing will be removed from job seeker
          search results.
        </>
      }
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
}
