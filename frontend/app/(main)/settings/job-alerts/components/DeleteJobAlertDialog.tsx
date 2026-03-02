"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JobAlert } from "@/lib/types";
import { useDeleteJobAlert } from "../hooks/manage-job-alerts";

interface DeleteJobAlertDialogProps {
  alert: JobAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteJobAlertDialog({ alert, open, onOpenChange }: DeleteJobAlertDialogProps) {
  const deleteMutation = useDeleteJobAlert();

  const handleDelete = async () => {
    if (!alert) return;
    await deleteMutation.mutateAsync(alert.id);
    onOpenChange(false);
  };

  if (!alert) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Job Alert</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{alert.name}"? This action cannot be undone and you will
            stop receiving notifications for this alert.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
