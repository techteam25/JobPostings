"use client";

import { useToggleSavedJob } from "./use-saved-jobs";

export function useJobSaved(
  jobId: number | undefined,
  hasSaved: boolean,
  isAuthenticated: boolean,
) {
  return useToggleSavedJob(jobId, hasSaved, isAuthenticated);
}
