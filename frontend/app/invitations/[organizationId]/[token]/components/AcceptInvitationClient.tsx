"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAcceptInvitation } from "@/app/employer/organizations/hooks/use-manage-invitations";
import type { InvitationDetails } from "@/lib/types";

interface AcceptInvitationClientProps {
  organizationId: number;
  token: string;
  invitation: InvitationDetails;
}

export const AcceptInvitationClient = ({
  organizationId,
  token,
  invitation,
}: AcceptInvitationClientProps) => {
  const router = useRouter();
  const acceptMutation = useAcceptInvitation();

  const handleAccept = () => {
    acceptMutation.mutate(
      { organizationId, token },
      {
        onSuccess: () => {
          router.push(`/employer/organizations/${organizationId}`);
        },
      },
    );
  };

  const handleDecline = () => {
    router.push("/");
  };

  const orgInitials = invitation.organizationName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{orgInitials}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">You&apos;re Invited!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {invitation.inviterName}
              </span>{" "}
              invited you to join{" "}
              <span className="font-semibold text-gray-900">
                {invitation.organizationName}
              </span>{" "}
              as a{" "}
              <Badge variant="secondary" className="ml-1">
                {invitation.role}
              </Badge>
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p>
              <span className="font-medium">Expires:</span>{" "}
              {new Date(invitation.expiresAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={handleDecline}
              disabled={acceptMutation.isPending}
            >
              Decline
            </Button>
            <Button
              className="bg-primary/90 hover:bg-primary flex-1 cursor-pointer"
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? "Accepting..." : "Accept Invitation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
