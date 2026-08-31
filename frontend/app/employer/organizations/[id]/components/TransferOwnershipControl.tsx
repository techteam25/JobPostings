"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Member } from "@/lib/types";

export function getEligibleOwnershipSuccessors(
  members: Member[],
  currentUserId: number,
): Member[] {
  return members.filter(
    (member) =>
      member.isActive &&
      member.role === "admin" &&
      member.userId !== currentUserId,
  );
}

export function getTransferDisabledCopy(
  members: Member[],
  currentUserId: number,
): string | null {
  const eligible = getEligibleOwnershipSuccessors(members, currentUserId);
  if (eligible.length > 0) return null;

  const otherActiveMembers = members.filter(
    (member) => member.isActive && member.userId !== currentUserId,
  );

  if (otherActiveMembers.length === 0) {
    return "Invite someone, make them an admin, then transfer — or delete the organization.";
  }

  return "Change a member’s role to admin, then transfer.";
}

interface TransferOwnershipControlProps {
  members: Member[];
  currentUserId: number;
  onTransferOwnership: (memberId: number) => Promise<void>;
  onTransferred?: () => void;
  isPending?: boolean;
}

export function TransferOwnershipControl({
  members,
  currentUserId,
  onTransferOwnership,
  onTransferred,
  isPending = false,
}: TransferOwnershipControlProps) {
  const [open, setOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentMembership = members.find(
    (member) => member.userId === currentUserId && member.isActive,
  );
  const isOwner = currentMembership?.role === "owner";

  const eligibleSuccessors = useMemo(
    () => getEligibleOwnershipSuccessors(members, currentUserId),
    [members, currentUserId],
  );
  const disabledCopy = useMemo(
    () => getTransferDisabledCopy(members, currentUserId),
    [members, currentUserId],
  );

  if (!isOwner) {
    return null;
  }

  const selectedSuccessor = eligibleSuccessors.find(
    (member) => String(member.id) === selectedMemberId,
  );
  const canSubmit = Boolean(selectedSuccessor) && !isPending && !submitting;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedMemberId("");
      setError(null);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSuccessor) return;

    setSubmitting(true);
    setError(null);

    try {
      await onTransferOwnership(selectedSuccessor.id);
    } catch (transferError) {
      const message =
        transferError instanceof Error
          ? transferError.message
          : "Failed to transfer ownership";
      setError(message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setOpen(false);
    setSelectedMemberId("");
    toast.success(
      `${selectedSuccessor.memberName} is now the owner. You are now an admin.`,
    );
    onTransferred?.();
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={Boolean(disabledCopy) || isPending}
        onClick={() => setOpen(true)}
      >
        Transfer ownership
      </Button>
      {disabledCopy ? (
        <p className="text-muted-foreground max-w-xl text-sm">{disabledCopy}</p>
      ) : null}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer ownership</DialogTitle>
            <DialogDescription asChild>
              <div className="text-muted-foreground flex flex-col gap-2 text-sm">
                <p>
                  You will become an admin and lose owner-only settings (edit
                  organization, logo, and delete organization).
                </p>
                <p>The new owner can transfer ownership back to you later.</p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="ownership-successor"
              className="text-sm font-medium"
            >
              New owner
            </label>
            <Select
              value={selectedMemberId}
              onValueChange={(value) => {
                setSelectedMemberId(value);
                setError(null);
              }}
            >
              <SelectTrigger id="ownership-successor">
                <SelectValue placeholder="Select an admin" />
              </SelectTrigger>
              <SelectContent>
                {eligibleSuccessors.map((member) => (
                  <SelectItem key={member.id} value={String(member.id)}>
                    {member.memberName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending || submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={!canSubmit}>
              {isPending || submitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Transfer ownership"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
