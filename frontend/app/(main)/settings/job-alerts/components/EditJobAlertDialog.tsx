"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JobAlertForm } from "./JobAlertForm";
import { useUpdateJobAlert } from "../hooks/manage-job-alerts";
import { JobAlert } from "@/lib/types";
import { JobAlertFormData } from "@/schemas/job-alerts";

interface EditJobAlertDialogProps {
  alert: JobAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditJobAlertDialog({ alert, open, onOpenChange }: EditJobAlertDialogProps) {
  const updateMutation = useUpdateJobAlert();

  const handleSubmit = async (data: JobAlertFormData) => {
    if (!alert) return;
    await updateMutation.mutateAsync({ id: alert.id, data });
    onOpenChange(false);
  };

  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Alert</DialogTitle>
          <DialogDescription>
            Update your job alert preferences.
          </DialogDescription>
        </DialogHeader>
        <JobAlertForm
          initialData={alert}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
