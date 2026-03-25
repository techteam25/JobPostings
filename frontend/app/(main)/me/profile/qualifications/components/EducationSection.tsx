"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Education } from "@/lib/types";
import { EducationCard } from "./EducationCard";
import { AddEducationDialog } from "./AddEducationDialog";
import { EditEducationDialog } from "./EditEducationDialog";
import { DeleteEducationDialog } from "./DeleteEducationDialog";
import { QualificationEmptyState } from "./QualificationEmptyState";

interface EducationSectionProps {
  education: Education[];
}

export function EducationSection({ education }: EducationSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(
    null,
  );

  function handleEdit(edu: Education) {
    setSelectedEducation(edu);
    setEditDialogOpen(true);
  }

  function handleDelete(edu: Education) {
    setSelectedEducation(edu);
    setDeleteDialogOpen(true);
  }

  return (
    <>
      {education.length === 0 ? (
        <QualificationEmptyState
          title="No Education Added"
          description="Add your educational background to strengthen your profile."
          ctaLabel="Add Education"
          onAdd={() => setAddDialogOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus data-icon="inline-start" />
              Add Education
            </Button>
          </div>
          {education.map((edu) => (
            <EducationCard
              key={edu.id}
              education={edu}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddEducationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
      <EditEducationDialog
        key={selectedEducation?.id}
        education={selectedEducation}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <DeleteEducationDialog
        education={selectedEducation}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
}
