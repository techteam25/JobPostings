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
import { useDeleteWorkExperience } from "../hooks/manage-work-experiences";
import type { WorkExperience } from "@/lib/types";

interface DeleteWorkExperienceDialogProps {
  experience: WorkExperience | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteWorkExperienceDialog({
  experience,
  open,
  onOpenChange,
}: DeleteWorkExperienceDialogProps) {
  const deleteMutation = useDeleteWorkExperience();

  async function handleDelete() {
    if (!experience) return;
    await deleteMutation.mutateAsync(experience.id);
    onOpenChange(false);
  }

  if (!experience) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Work Experience</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete your work experience at{" "}
            <span className="font-medium">{experience.companyName}</span>? This
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
