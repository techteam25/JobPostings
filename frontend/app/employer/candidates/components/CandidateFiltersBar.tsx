"use client";

import { useState } from "react";
import { Check, Filter, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { useCandidateSearchStore } from "@/context/candidate-search-store";
import { useSearchSkills } from "../hooks/useSearchSkills";

function SkillsCombobox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { skills, addSkill, removeSkill } = useCandidateSearchStore();
  const { data: suggestions = [], isLoading } = useSearchSkills(query);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">Skills</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add skill
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search skills…"
            />
            <CommandList>
              {isLoading ? (
                <div className="text-muted-foreground px-4 py-6 text-center text-sm">
                  Searching…
                </div>
              ) : (
                <>
                  <CommandEmpty>No matching skills.</CommandEmpty>
                  <CommandGroup>
                    {suggestions.map((skill) => {
                      const selected = skills.includes(skill.name);
                      return (
                        <CommandItem
                          key={skill.id}
                          value={skill.name}
                          onSelect={() => {
                            if (selected) {
                              removeSkill(skill.name);
                            } else {
                              addSkill(skill.name);
                            }
                            setQuery("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {skill.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="gap-1.5 font-normal"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="hover:bg-muted-foreground/20 rounded-full"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Add skills to narrow by matching expertise.
        </p>
      )}
    </div>
  );
}

function SharedFilterControls() {
  const {
    location,
    minYearsExperience,
    openToWork,
    setLocation,
    setMinYearsExperience,
    setOpenToWork,
  } = useCandidateSearchStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="candidate-location" className="text-sm font-medium">
          Location
        </Label>
        <Input
          id="candidate-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, state, or country"
          maxLength={200}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="candidate-min-years" className="text-sm font-medium">
          Minimum years of experience
        </Label>
        <Input
          id="candidate-min-years"
          type="number"
          min={0}
          max={50}
          value={minYearsExperience ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setMinYearsExperience(null);
              return;
            }
            const parsed = Number.parseInt(raw, 10);
            if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 50) {
              setMinYearsExperience(parsed);
            }
          }}
          placeholder="0"
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
        <div className="flex flex-col">
          <Label
            htmlFor="candidate-open-to-work"
            className="text-sm font-medium"
          >
            Open to work only
          </Label>
          <span className="text-muted-foreground text-xs">
            Show candidates actively seeking roles.
          </span>
        </div>
        <Switch
          id="candidate-open-to-work"
          checked={openToWork}
          onCheckedChange={setOpenToWork}
        />
      </div>
    </div>
  );
}

export function CandidateFiltersBar() {
  const { clearFilters, skills } = useCandidateSearchStore();

  return (
    <div className="bg-card flex flex-col gap-4 rounded-lg border p-4">
      {/* Mobile: drawer trigger */}
      <div className="flex items-center justify-between md:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters{skills.length > 0 ? ` (${skills.length})` : ""}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filter candidates</DrawerTitle>
              <DrawerDescription>
                Narrow your search by skills, location, and availability.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-6 px-4 pb-4">
              <SkillsCombobox />
              <SharedFilterControls />
            </div>
            <DrawerFooter>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
              <DrawerClose asChild>
                <Button>Apply</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        {skills.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        ) : null}
      </div>

      {/* Desktop: inline filters */}
      <div className="hidden flex-col gap-4 md:flex md:flex-row md:flex-wrap md:items-end md:gap-6">
        <div className="min-w-[260px] flex-1">
          <SkillsCombobox />
        </div>
        <div className="min-w-[240px] flex-1">
          <SharedFilterControls />
        </div>
        <div className="ml-auto">
          {skills.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
