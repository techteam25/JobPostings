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
import type { PendingInvitation } from "@/lib/types";

interface CancelInvitationDialogProps {
  invitation: PendingInvitation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isPending?: boolean;
}

export function CancelInvitationDialog({
  invitation,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: CancelInvitationDialogProps) {
  if (!invitation) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel the invitation for{" "}
            <span className="font-medium">{invitation.email}</span>? They will
            no longer be able to accept this invitation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Keep Invitation
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Cancelling..." : "Cancel Invitation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
