"use client";

import { useMemo } from "react";

import { JobCard } from "@/components/JobCard";
import { JobTypeEnum } from "@/lib/types";
import { formatPostedDate } from "@/lib/utils";
import type { SearchJobResult } from "@/schemas/responses/jobs/search";

interface SearchJobsListProps {
  data: SearchJobResult[];
  onJobSelected: (id: number) => void;
  selectedId: number | undefined;
}

/**
 * Maps Typesense `SearchJobResult` documents onto the `JobCard` contract used
 * by the default feed. Two notable gaps vs. the default listing:
 *   - `id` is stringified in Typesense, so we coerce to number for routing.
 *   - `hasSaved` isn't per-user indexed, so search cards always render as
 *     unsaved (clicking Save still works — the Toggle calls the save API).
 */
export function SearchJobsList({
  data,
  onJobSelected,
  selectedId,
}: SearchJobsListProps) {
  const jobs = useMemo(
    () =>
      data.map((result) => {
        const jobId = Number(result.id);
        const location =
          [result.city, result.state].filter(Boolean).join(", ") || "Remote";

        return (
          <JobCard
            key={result.id}
            jobId={jobId}
            jobType={result.jobType as JobTypeEnum}
            jobDescription={result.description}
            companyName={result.company}
            experienceLevel={result.experience || "Not Specified"}
            location={location}
            isSelected={selectedId === jobId}
            positionName={result.title}
            posted={formatPostedDate(new Date(result.createdAt))}
            logoUrl={result.logoUrl ?? null}
            onJobSelected={() => onJobSelected(jobId)}
            hasSaved={false}
          />
        );
      }),
    [data, selectedId, onJobSelected],
  );

  return <>{jobs}</>;
}
