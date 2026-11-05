"use client";

import { useMemo, useState } from "react";
import { Job } from "@/schemas/responses/jobs";
import { DataTable } from "@/components/common";
import { getJobListingColumns } from "./job-listing-columns";
import { DeleteJobDialog } from "./DeleteJobDialog";
import { ReopenJobDialog } from "./ReopenJobDialog";

interface JobListingTableProps {
  jobs: Job[];
  organizationId: number;
  onCloseJob: (jobId: number) => Promise<void>;
  onReopenJob: (jobId: number, applicationDeadline: string) => Promise<void>;
  onDuplicate: (job: Job) => Promise<void>;
  canDeleteJobs?: boolean;
  onDeleteJob?: (jobId: number) => Promise<void>;
  isDeletePending?: boolean;
}

export function JobListingTable({
  jobs,
  organizationId,
  onCloseJob,
  onReopenJob,
  onDuplicate,
  canDeleteJobs = false,
  onDeleteJob,
  isDeletePending = false,
}: JobListingTableProps) {
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [jobToReopen, setJobToReopen] = useState<Job | null>(null);
  const [deletedJobIds, setDeletedJobIds] = useState<Set<number>>(new Set());

  const visibleJobs = useMemo(
    () => jobs.filter((job) => !deletedJobIds.has(job.id)),
    [jobs, deletedJobIds],
  );

  const columns = useMemo(
    () =>
      getJobListingColumns({
        organizationId,
        onCloseJob,
        onRequestReopen: setJobToReopen,
        onDuplicate,
        canDeleteJobs,
        onRequestDelete: setJobToDelete,
      }),
    [organizationId, onCloseJob, onDuplicate, canDeleteJobs],
  );

  const handleConfirmReopen = async (applicationDeadline: string) => {
    if (!jobToReopen) return;

    try {
      await onReopenJob(jobToReopen.id, applicationDeadline);
    } catch {
      return;
    }

    setJobToReopen(null);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete || !onDeleteJob) return;

    try {
      await onDeleteJob(jobToDelete.id);
    } catch {
      return;
    }

    setDeletedJobIds((previous) => new Set(previous).add(jobToDelete.id));
    setJobToDelete(null);
  };

  return (
    <>
      <DataTable columns={columns} data={visibleJobs} />
      <DeleteJobDialog
        job={jobToDelete}
        open={jobToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setJobToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isPending={isDeletePending}
      />
      <ReopenJobDialog
        key={jobToReopen?.id ?? "idle"}
        job={jobToReopen}
        open={jobToReopen !== null}
        onOpenChange={(open) => {
          if (!open) setJobToReopen(null);
        }}
        onConfirm={handleConfirmReopen}
      />
    </>
  );
}
