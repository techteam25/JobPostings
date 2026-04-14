"use client";

import { useMemo } from "react";
import { Job } from "@/schemas/responses/jobs";
import { DataTable } from "./data-table";
import { getJobListingColumns } from "./job-listing-columns";

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
  const columns = useMemo(
    () => getJobListingColumns({ organizationId, onCloseJob, onDuplicate }),
    [organizationId, onCloseJob, onDuplicate],
  );

  return (
    <div className="overflow-x-auto">
      <DataTable columns={columns} data={jobs} />
    </div>
  );
}
