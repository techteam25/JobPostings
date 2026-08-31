"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { PendingOrganizationInvitation } from "@/lib/types";

interface CancelInvitationDialogProps {
  invitation: PendingOrganizationInvitation | null;
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
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel Invitation"
      description={
        <>
          Are you sure you want to cancel the invitation for{" "}
          <span className="font-medium">{invitation.email}</span>? They will no
          longer be able to accept this invitation.
        </>
      }
      cancelLabel="Keep Invitation"
      confirmLabel="Cancel Invitation"
      pendingLabel="Cancelling..."
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
}
