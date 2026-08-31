"use client";

import { useMemo } from "react";
import { Job } from "@/schemas/responses/jobs";
import { DataTable } from "@/components/common";
import { getJobListingColumns } from "./job-listing-columns";

interface JobListingTableProps {
  jobs: Job[];
  organizationId: number;
  onCloseJob: (jobId: number) => Promise<void>;
  onReopenJob: (jobId: number) => Promise<void>;
  onDuplicate: (job: Job) => Promise<void>;
}

export function JobListingTable({
  jobs,
  organizationId,
  onCloseJob,
  onReopenJob,
  onDuplicate,
}: JobListingTableProps) {
  const columns = useMemo(
    () =>
      getJobListingColumns({
        organizationId,
        onCloseJob,
        onReopenJob,
        onDuplicate,
      }),
    [organizationId, onCloseJob, onReopenJob, onDuplicate],
  );

  return <DataTable columns={columns} data={jobs} />;
}
