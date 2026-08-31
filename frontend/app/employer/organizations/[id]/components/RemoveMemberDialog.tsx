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
import type { Member } from "@/lib/types";

interface RemoveMemberDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isPending?: boolean;
}

export function RemoveMemberDialog({
  member,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: RemoveMemberDialogProps) {
  if (!member) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-medium">{member.memberName}</span> from this
            organization? They will lose access immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Removing..." : "Remove Member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
