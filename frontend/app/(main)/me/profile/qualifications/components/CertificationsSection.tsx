"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { Certification } from "@/lib/types";
import { AddCertificationDialog } from "./AddCertificationDialog";
import { QualificationEmptyState } from "./QualificationEmptyState";
import { useUnlinkCertification } from "../hooks/manage-certifications";

interface CertificationsSectionProps {
  certifications: { certification: Certification }[];
}

export function CertificationsSection({
  certifications,
}: CertificationsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] =
    useState<Certification | null>(null);

  const unlinkMutation = useUnlinkCertification();

  function handleRemove(certification: Certification) {
    setSelectedCertification(certification);
    setRemoveDialogOpen(true);
  }

  async function confirmRemove() {
    if (!selectedCertification) return;
    await unlinkMutation.mutateAsync(selectedCertification.id);
    setRemoveDialogOpen(false);
  }

  return (
    <>
      {certifications.length === 0 ? (
        <QualificationEmptyState
          title="No Certifications Added"
          description="Add professional certifications to demonstrate your expertise."
          ctaLabel="Add Certification"
          onAdd={() => setAddDialogOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus data-icon="inline-start" />
              Add Certification
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {certifications.map((c) => (
              <Badge
                key={c.certification.id}
                variant="secondary"
                className="gap-1.5 py-1.5 pr-1.5 pl-3 text-sm"
              >
                {c.certification.certificationName}
                <button
                  type="button"
                  onClick={() => handleRemove(c.certification)}
                  className="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${c.certification.certificationName}`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <AddCertificationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        existingCertifications={certifications.map((c) => c.certification)}
      />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Certification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">
                {selectedCertification?.certificationName}
              </span>{" "}
              from your profile? The certification will remain in the master
              list for others to use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              disabled={unlinkMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinkMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
