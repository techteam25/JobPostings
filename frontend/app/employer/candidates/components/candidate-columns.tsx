"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { CandidatePreview } from "@/types/candidate";

const MAX_SKILL_CHIPS = 5;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export const candidateColumns: ColumnDef<CandidatePreview>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Candidate
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const candidate = row.original;
      return (
        <div className="flex items-start gap-3">
          <Avatar className="size-10">
            {candidate.photoUrl ? (
              <AvatarImage src={candidate.photoUrl} alt={candidate.name} />
            ) : null}
            <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-semibold">
              {candidate.name}
            </span>
            <span className="text-muted-foreground line-clamp-2 text-xs">
              {candidate.headline || "\u2014"}
            </span>
          </div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <span className="text-secondary-foreground text-sm">
        {row.original.location || "\u2014"}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: "skills",
    header: "Skills",
    cell: ({ row }) => {
      const skills = row.original.skills;
      const visible = skills.slice(0, MAX_SKILL_CHIPS);
      const overflow = skills.slice(MAX_SKILL_CHIPS);

      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {visible.map((skill) => (
            <Badge key={skill} variant="secondary" className="font-normal">
              {skill}
            </Badge>
          ))}
          {overflow.length > 0 ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-default">
                    +{overflow.length} more
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <span className="text-xs">{overflow.join(", ")}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "yearsOfExperience",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Years
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {row.original.yearsOfExperience}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "openToWork",
    header: "Availability",
    cell: ({ row }) =>
      row.original.openToWork ? (
        <Badge variant="default">Open to work</Badge>
      ) : (
        <Badge variant="secondary" className="text-muted-foreground">
          Not available
        </Badge>
      ),
    enableSorting: false,
  },
];
