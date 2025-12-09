"use client";

import { useCallback, useEffect } from "react";
import {
  isJobSavedByUser,
  removeSavedJobForUser,
  saveJobForUser,
} from "@/lib/api";
import { useSavedJobsStore } from "@/context/store";

export function useJobSaved(jobId: number | undefined) {
  const savedJobIds = useSavedJobsStore((state) => state.savedJobIds);
  const setSavedJob = useSavedJobsStore((state) => state.setSavedJob);

  const hasSaved = jobId !== undefined ? savedJobIds.has(jobId) : false;

  useEffect(() => {
    if (jobId === undefined) return;

    let mounted = true;

    const checkSavedJob = async () => {
      try {
        const savedState = await isJobSavedByUser(jobId);
        if (mounted && savedState.success) {
          setSavedJob(jobId, savedState.data.isSaved);
        }
      } catch {
        if (mounted) {
          setSavedJob(jobId, false);
        }
      }
    };

    checkSavedJob();

    return () => {
      mounted = false;
    };
  }, [jobId, setSavedJob]);

  const toggleSaved = useCallback(async () => {
    if (jobId === undefined) return;

    const previousState = hasSaved;

    // Optimistic update
    setSavedJob(jobId, !previousState);

    try {
      if (previousState) {
        await removeSavedJobForUser(jobId);
      } else {
        await saveJobForUser(jobId);
      }
    } catch {
      // Revert on error
      setSavedJob(jobId, previousState);
    }
  }, [jobId, hasSaved, setSavedJob]);

  return { hasSaved, toggleSaved };
}
