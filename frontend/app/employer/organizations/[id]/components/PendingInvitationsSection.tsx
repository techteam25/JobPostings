"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFetchPendingInvitations } from "@/app/employer/organizations/hooks/use-fetch-pending-invitations";
import { useCancelInvitation } from "@/app/employer/organizations/hooks/use-manage-invitations";
import type { PendingInvitation } from "@/lib/types";
import { formatToReadableDate } from "@/lib/utils";
import { CancelInvitationDialog } from "./CancelInvitationDialog";

interface PendingInvitationsSectionProps {
  organizationId: number;
  canManageInvitations: boolean;
}

export function PendingInvitationsSection({
  organizationId,
  canManageInvitations,
}: PendingInvitationsSectionProps) {
  const { pendingInvitations, isFetching } = useFetchPendingInvitations(
    organizationId,
    canManageInvitations,
  );
  const { mutateAsync: cancelInvitation, isPending } =
    useCancelInvitation(organizationId);
  const [invitationToCancel, setInvitationToCancel] =
    useState<PendingInvitation | null>(null);

  if (!canManageInvitations) {
    return null;
  }

  if (isFetching) {
    return (
      <Card className="mb-6 border-0 p-6 shadow-sm">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading pending invitations...
        </div>
      </Card>
    );
  }

  if (pendingInvitations.length === 0) {
    return null;
  }

  const handleConfirmCancel = async () => {
    if (!invitationToCancel) return;

    try {
      await cancelInvitation(invitationToCancel.id);
      setInvitationToCancel(null);
    } catch {
      // Error toast handled by mutation hook.
    }
  };

  return (
    <>
      <Card className="mb-6 border-0 shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-center gap-2">
            <Mail className="text-primary h-5 w-5" />
            <h2 className="text-foreground text-lg font-semibold">
              Pending Invitations
            </h2>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Invitations that have been sent but not yet accepted.
          </p>
        </div>

        <div className="divide-y">
          {pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="text-foreground font-medium">
                  {invitation.email}
                </span>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary">{invitation.role}</Badge>
                  <span className="text-muted-foreground">
                    Sent {formatToReadableDate(invitation.createdAt)}
                  </span>
                  <span className="text-muted-foreground">
                    Expires {formatToReadableDate(invitation.expiresAt)}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvitationToCancel(invitation)}
                aria-label={`Cancel invitation for ${invitation.email}`}
              >
                Cancel
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <CancelInvitationDialog
        invitation={invitationToCancel}
        open={invitationToCancel !== null}
        onOpenChange={(open) => {
          if (!open) setInvitationToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        isPending={isPending}
      />
    </>
  );
}
