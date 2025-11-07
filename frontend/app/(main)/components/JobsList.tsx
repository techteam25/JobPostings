"use client";

import { formatPostedDate } from "@/lib/utils";
import { JobCard } from "@/components/JobCard";

import { JobType } from "@/lib/types";
import type { JobsResponse } from "@/schemas/responses/jobs";

interface JobsListProps {
  data: JobsResponse;
  onJobSelected: (id: number) => void;
}
export const JobsList = ({ data, onJobSelected }: JobsListProps) => {
  return (
    <>
      {data &&
        data.data.map(({ job, employer }) => (
          <JobCard
            key={job.id}
            jobType={job.jobType as JobType}
            jobDescription={job.description}
            companyName={employer!.name}
            experienceLevel={job.experience || "Not Specified"}
            location={`${job.city}, ${job.state || job.country}`}
            positionName={job.title}
            posted={formatPostedDate(job.createdAt)}
            logoUrl={employer?.logoUrl || null}
            onJobSelected={() => onJobSelected(job.id)}
          />
        ))}
    </>
  );
};
