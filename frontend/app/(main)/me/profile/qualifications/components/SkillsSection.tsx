"use client";

import { useState } from "react";
import { Info, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { UserSkill } from "@/lib/types";
import { AddSkillDialog } from "./AddSkillDialog";
import { SkillBadges } from "./SkillBadges";
import { QualificationEmptyState } from "./QualificationEmptyState";
import { useUnlinkSkill } from "../hooks/manage-skills";

const MAX_SKILLS = 30;

interface SkillsSectionProps {
  skills: UserSkill[];
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);

  const unlinkMutation = useUnlinkSkill();

  const isAtLimit = skills.length >= MAX_SKILLS;

  function handleRemove(skill: UserSkill) {
    setSelectedSkill(skill);
    setRemoveDialogOpen(true);
  }

  async function confirmRemove() {
    if (!selectedSkill) return;
    await unlinkMutation.mutateAsync(selectedSkill.skillId);
    setRemoveDialogOpen(false);
  }

  return (
    <>
      {skills.length === 0 ? (
        <QualificationEmptyState
          title="No Skills Added"
          description="Add skills to help employers find you for relevant opportunities."
          ctaLabel="Add Skill"
          onAdd={() => setAddDialogOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {skills.length}/{MAX_SKILLS} skills
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              disabled={isAtLimit}
            >
              <Plus data-icon="inline-start" />
              Add Skill
            </Button>
          </div>

          {isAtLimit && (
            <Alert className="border-primary/20 bg-primary/5">
              <Info className="text-primary size-4" />
              <AlertDescription>
                You&apos;ve reached the {MAX_SKILLS}-skill limit. Remove skills
                to add more.
              </AlertDescription>
            </Alert>
          )}

          <SkillBadges skills={skills} onRemove={handleRemove} />
        </div>
      )}

      <AddSkillDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        existingSkills={skills}
      />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">{selectedSkill?.skill.name}</span>{" "}
              from your profile? The skill will remain in the master list for
              others to use.
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
