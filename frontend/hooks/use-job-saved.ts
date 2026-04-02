"use client";

import { useToggleSavedJob } from "./use-saved-jobs";

export function useJobSaved(
  jobId: number | undefined,
  isAuthenticated: boolean,
) {
  return useToggleSavedJob(jobId, isAuthenticated);
}
