"use client";

import { useMemo } from "react";
import { formatPostedDate } from "@/lib/utils";
import { JobCard } from "@/components/JobCard";

import { JobType } from "@/lib/types";
import type { JobsResponse, JobWithEmployer } from "@/schemas/responses/jobs";

interface JobsListProps {
  data: JobWithEmployer[];
  onJobSelected: (id: number) => void;
  selectedId: number | undefined;
}
export const JobsList = ({
  data,
  onJobSelected,
  selectedId,
}: JobsListProps) => {
  const jobs = useMemo(
    () =>
      data.map(({ job, employer }) => (
        <JobCard
          key={job.id}
          jobId={job.id}
          jobType={job.jobType as JobType}
          jobDescription={job.description}
          companyName={employer!.name}
          experienceLevel={job.experience || "Not Specified"}
          location={`${job.city}, ${job.state || job.country}`}
          isSelected={selectedId === job.id}
          positionName={job.title}
          posted={formatPostedDate(job.createdAt)}
          logoUrl={employer?.logoUrl || null}
          onJobSelected={() => onJobSelected(job.id)}
        />
      )),
    [data, selectedId, onJobSelected],
  );

  return <>{jobs}</>;
};
