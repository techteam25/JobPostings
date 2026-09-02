"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganization } from "../../../context/organization-context";
import { useDeleteOrganization } from "../../../hooks/use-delete-organization";
import { useTransferOwnership } from "@/app/employer/organizations/hooks/use-transfer-ownership";
import { TransferOwnershipControl } from "../../../components/TransferOwnershipControl";

export function DangerZone() {
  const router = useRouter();
  const { organization, currentUserId } = useOrganization();
  const { mutateAsync: deleteOrg, isPending } = useDeleteOrganization(
    organization.id,
  );
  const { mutateAsync: transferOwnership, isPending: isTransferPending } =
    useTransferOwnership(organization.id);
  const [confirmName, setConfirmName] = useState("");
  const [open, setOpen] = useState(false);

  const canDelete = confirmName === organization.name;

  const handleDelete = async () => {
    await deleteOrg();
    setOpen(false);
  };

  return (
    <section
      aria-label="Danger zone"
      className="border-destructive/50 rounded-lg border p-6"
    >
      <h2 className="text-destructive text-lg font-semibold">Danger Zone</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Irreversible and destructive actions for this organization.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <TransferOwnershipControl
          members={organization.members}
          currentUserId={currentUserId}
          isPending={isTransferPending}
          onTransferOwnership={transferOwnership}
          onTransferred={() => {
            router.push(
              `/employer/organizations/${organization.id}/settings?tab=members`,
            );
          }}
        />

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 data-icon="inline-start" />
              Delete Organization
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                organization <strong>{organization.name}</strong> and all
                associated data including jobs, applications, and members.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex flex-col gap-2 py-4">
              <Label htmlFor="confirm-org-name">
                Type <strong>{organization.name}</strong> to confirm
              </Label>
              <Input
                id="confirm-org-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={organization.name}
                autoComplete="off"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmName("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={!canDelete || isPending}
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      data-icon="inline-start"
                    />
                    Deleting...
                  </>
                ) : (
                  "Delete Organization"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
