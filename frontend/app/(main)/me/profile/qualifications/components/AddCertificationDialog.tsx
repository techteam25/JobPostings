"use client";

import { useState } from "react";
import { Award, Plus, Loader2, Check } from "lucide-react";

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
import type { Certification } from "@/lib/types";
import {
  useSearchCertifications,
  useLinkCertification,
} from "../hooks/manage-certifications";

interface AddCertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCertifications: Certification[];
}

export function AddCertificationDialog({
  open,
  onOpenChange,
  existingCertifications,
}: AddCertificationDialogProps) {
  const [query, setQuery] = useState("");

  const {
    data: searchResults,
    isLoading,
    isPlaceholderData,
  } = useSearchCertifications(query);
  const linkMutation = useLinkCertification();

  const existingIds = new Set(existingCertifications.map((c) => c.id));

  const results = searchResults ?? [];
  const showSpinner = isLoading && !isPlaceholderData;

  const exactMatch = results.some(
    (c) => c.certificationName.toLowerCase() === query.trim().toLowerCase(),
  );

  const showCreateOption = query.trim().length > 0 && !exactMatch;

  async function handleSelect(certificationName: string) {
    await linkMutation.mutateAsync(certificationName);
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
          <DialogTitle>Add Certification</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search certifications..."
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
                  ? "Type to search certifications..."
                  : "No certifications found."}
              </CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Certifications">
                {results.map((cert) => {
                  const alreadyLinked = existingIds.has(cert.id);
                  return (
                    <CommandItem
                      key={cert.id}
                      value={cert.certificationName}
                      onSelect={() => {
                        if (!alreadyLinked) {
                          handleSelect(cert.certificationName);
                        }
                      }}
                      disabled={alreadyLinked || linkMutation.isPending}
                      className={alreadyLinked ? "opacity-50" : ""}
                    >
                      {alreadyLinked ? (
                        <Check className="text-muted-foreground" />
                      ) : (
                        <Award className="text-muted-foreground" />
                      )}
                      {cert.certificationName}
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
