"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JobAlertForm } from "./JobAlertForm";
import { useCreateJobAlert } from "../hooks/manage-job-alerts";
import { JobAlertFormData } from "@/schemas/job-alerts";

interface CreateJobAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobAlertDialog({ open, onOpenChange }: CreateJobAlertDialogProps) {
  const createMutation = useCreateJobAlert();

  const handleSubmit = async (data: JobAlertFormData) => {
    await createMutation.mutateAsync(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Job Alert</DialogTitle>
          <DialogDescription>
            Set up a new job alert to receive notifications when matching jobs are posted.
          </DialogDescription>
        </DialogHeader>
        <JobAlertForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
      </DialogContent>
    </Dialog>
  );
}
