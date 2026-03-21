"use client";

import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatToReadableDate } from "@/lib/utils";
import { Job } from "@/schemas/responses/jobs";
import { JobStatusBadge } from "./JobStatusBadge";

interface JobListingTableProps {
  jobs: Job[];
  organizationId: number;
  onCloseJob: (jobId: number) => Promise<void>;
  onDuplicate: (job: Job) => Promise<void>;
}

export function JobListingTable({
  jobs,
  organizationId,
  onCloseJob,
  onDuplicate,
}: JobListingTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-background">
            <TableHead>Job title</TableHead>
            <TableHead>Location (City)</TableHead>
            <TableHead>Date posted</TableHead>
            <TableHead>Closing date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className="hover:bg-background">
              <TableCell className="font-medium">
                <div>
                  <div className="text-foreground text-sm font-semibold">
                    {job.title}
                  </div>
                  <div className="text-secondary-foreground mt-1 text-xs">
                    {job.jobType}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">{job.city}</span>
              </TableCell>
              <TableCell className="text-secondary-foreground">
                {formatToReadableDate(job.createdAt)}
              </TableCell>
              <TableCell className="text-secondary-foreground">
                {job.applicationDeadline
                  ? formatToReadableDate(job.applicationDeadline)
                  : "\u2014"}
              </TableCell>
              <TableCell>
                <JobStatusBadge job={job} />
              </TableCell>
              <TableCell className="text-right">
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
                      onClick={() =>
                        toast.info("Job editing is coming soon")
                      }
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
