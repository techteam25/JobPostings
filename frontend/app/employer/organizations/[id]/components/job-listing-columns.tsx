"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Job } from "@/schemas/responses/jobs";
import { formatToReadableDate } from "@/lib/utils";
import { JobStatusBadge } from "./JobStatusBadge";

interface JobActionsContext {
  organizationId: number;
  onCloseJob: (jobId: number) => Promise<void>;
  onDuplicate: (job: Job) => Promise<void>;
}

function ActionsCell({
  job,
  organizationId,
  onCloseJob,
  onDuplicate,
}: { job: Job } & JobActionsContext) {
  const router = useRouter();

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-primary hover:text-primary-foreground [&_svg]:size-4"
          >
            Options
            <MoreVertical className="ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              router.push(
                `/employer/organizations/${organizationId}/applications`,
              )
            }
          >
            View Applicants
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toast.info("Job editing is coming soon")}
          >
            Edit Job
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(job)}>
            Duplicate
          </DropdownMenuItem>
          {job.isActive && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onCloseJob(job.id)}
            >
              Close Job
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function getJobListingColumns(
  context: JobActionsContext,
): ColumnDef<Job>[] {
  return [
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
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Job title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="text-foreground text-sm font-semibold">
            {row.original.title}
          </div>
          <div className="text-secondary-foreground mt-1 text-xs">
            {row.original.jobType}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Location (City)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("city")}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Date posted
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-secondary-foreground">
          {formatToReadableDate(row.getValue("createdAt"))}
        </span>
      ),
    },
    {
      accessorKey: "applicationDeadline",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Closing date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const deadline = row.getValue("applicationDeadline") as Date | null;
        return (
          <span className="text-secondary-foreground">
            {deadline ? formatToReadableDate(deadline) : "\u2014"}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <JobStatusBadge job={row.original} />,
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => <ActionsCell job={row.original} {...context} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
