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
import { useDeleteEducation } from "../hooks/manage-educations";
import type { Education } from "@/lib/types";

interface DeleteEducationDialogProps {
  education: Education | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteEducationDialog({
  education,
  open,
  onOpenChange,
}: DeleteEducationDialogProps) {
  const deleteMutation = useDeleteEducation();

  async function handleDelete() {
    if (!education) return;
    await deleteMutation.mutateAsync(education.id);
    onOpenChange(false);
  }

  if (!education) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Education</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete your education entry for{" "}
            <span className="font-medium">{education.schoolName}</span>? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
