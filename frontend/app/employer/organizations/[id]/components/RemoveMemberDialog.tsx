"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove Member"
      description={
        <>
          Are you sure you want to remove{" "}
          <span className="font-medium">{member.memberName}</span> from this
          organization? They will lose access immediately.
        </>
      }
      confirmLabel="Remove Member"
      pendingLabel="Removing..."
      isPending={isPending}
      onConfirm={onConfirm}
      destructive
    />
  );
}
