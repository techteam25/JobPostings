"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WorkExperience } from "@/lib/types";
import { WorkExperienceCard } from "./WorkExperienceCard";
import { AddWorkExperienceDialog } from "./AddWorkExperienceDialog";
import { EditWorkExperienceDialog } from "./EditWorkExperienceDialog";
import { DeleteWorkExperienceDialog } from "./DeleteWorkExperienceDialog";
import { QualificationEmptyState } from "./QualificationEmptyState";

interface WorkExperienceSectionProps {
  workExperiences: WorkExperience[];
}

export function WorkExperienceSection({
  workExperiences,
}: WorkExperienceSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] =
    useState<WorkExperience | null>(null);

  function handleEdit(exp: WorkExperience) {
    setSelectedExperience(exp);
    setEditDialogOpen(true);
  }

  function handleDelete(exp: WorkExperience) {
    setSelectedExperience(exp);
    setDeleteDialogOpen(true);
  }

  return (
    <>
      {workExperiences.length === 0 ? (
        <QualificationEmptyState
          title="No Work Experience Added"
          description="Add your work history to showcase your professional experience to employers."
          ctaLabel="Add Work Experience"
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
              Add Work Experience
            </Button>
          </div>
          {workExperiences.map((exp) => (
            <WorkExperienceCard
              key={exp.id}
              experience={exp}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddWorkExperienceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
      <EditWorkExperienceDialog
        experience={selectedExperience}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <DeleteWorkExperienceDialog
        experience={selectedExperience}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
}
