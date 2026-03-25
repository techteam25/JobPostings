"use client";

import { useState } from "react";
import { Lightbulb, Plus, Loader2, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { UserSkill } from "@/lib/types";
import { useSearchSkills, useLinkSkill } from "../hooks/manage-skills";

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSkills: UserSkill[];
}

export function AddSkillDialog({
  open,
  onOpenChange,
  existingSkills,
}: AddSkillDialogProps) {
  const [query, setQuery] = useState("");

  const {
    data: searchResults,
    isLoading,
    isPlaceholderData,
  } = useSearchSkills(query);
  const linkMutation = useLinkSkill();

  const existingIds = new Set(existingSkills.map((s) => s.skillId));

  const results = searchResults ?? [];
  const showSpinner = isLoading && !isPlaceholderData;

  const exactMatch = results.some(
    (s) => s.name.toLowerCase() === query.trim().toLowerCase(),
  );

  const showCreateOption = query.trim().length > 0 && !exactMatch;

  async function handleSelect(skillName: string) {
    await linkMutation.mutateAsync(skillName);
    setQuery("");
    onOpenChange(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setQuery("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Add Skill</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search skills..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {showSpinner && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
              </div>
            )}
            {!showSpinner && results.length === 0 && !showCreateOption && (
              <CommandEmpty>
                {query.trim().length === 0
                  ? "Type to search skills..."
                  : "No skills found."}
              </CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Skills">
                {results.map((skill) => {
                  const alreadyLinked = existingIds.has(skill.id);
                  return (
                    <CommandItem
                      key={skill.id}
                      value={skill.name}
                      onSelect={() => {
                        if (!alreadyLinked) {
                          handleSelect(skill.name);
                        }
                      }}
                      disabled={alreadyLinked || linkMutation.isPending}
                      className={alreadyLinked ? "opacity-50" : ""}
                    >
                      {alreadyLinked ? (
                        <Check className="text-muted-foreground" />
                      ) : (
                        <Lightbulb className="text-muted-foreground" />
                      )}
                      {skill.name}
                      {alreadyLinked && (
                        <span className="text-muted-foreground ml-auto text-xs">
                          Added
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {showCreateOption && (
              <CommandGroup heading="Create New">
                <CommandItem
                  value={`create-${query.trim()}`}
                  onSelect={() => handleSelect(query.trim())}
                  disabled={linkMutation.isPending}
                >
                  <Plus className="text-muted-foreground" />
                  Create &ldquo;{query.trim()}&rdquo;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
