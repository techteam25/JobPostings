"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedJobsApi } from "@/lib/api/client/saved-jobs";
import type { PaginatedApiResponse, SavedJob } from "@/lib/types";

export const useSavedJobs = (initialData?: PaginatedApiResponse<SavedJob>) => {
  return useQuery({
    queryKey: ["saved-jobs"],
    queryFn: savedJobsApi.getSavedJobs,
    initialData,
  });
};

export const useSaveJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savedJobsApi.saveJob,
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: ["saved-jobs"] });

      const previousSavedJobs = queryClient.getQueryData<
        PaginatedApiResponse<SavedJob>
      >(["saved-jobs"]);

      // Optimistically add to saved jobs list
      queryClient.setQueryData<PaginatedApiResponse<SavedJob>>(
        ["saved-jobs"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [...old.data, { job: { id: jobId } } as SavedJob],
          };
        },
      );

      return { previousSavedJobs, jobId };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previousSavedJobs) {
        queryClient.setQueryData(["saved-jobs"], context.previousSavedJobs);
      }
      toast.error("Failed to save job");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });
};

export const useUnsaveJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savedJobsApi.unsaveJob,
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: ["saved-jobs"] });

      const previousSavedJobs = queryClient.getQueryData<
        PaginatedApiResponse<SavedJob>
      >(["saved-jobs"]);

      // Optimistically remove from saved jobs list
      queryClient.setQueryData<PaginatedApiResponse<SavedJob>>(
        ["saved-jobs"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((savedJob) => savedJob.job.id !== jobId),
          };
        },
      );

      return { previousSavedJobs, jobId };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previousSavedJobs) {
        queryClient.setQueryData(["saved-jobs"], context.previousSavedJobs);
      }
      toast.error("Failed to remove saved job");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });
};

export function useToggleSavedJob(
  jobId: number | undefined,
  isAuthenticated: boolean,
) {
  const { data: savedJobsData } = useSavedJobs();
  const saveJobMutation = useSaveJobMutation();
  const unsaveJobMutation = useUnsaveJobMutation();

  const hasSaved = useMemo(() => {
    if (!jobId || !savedJobsData?.data) return false;
    return savedJobsData.data.some((savedJob) => savedJob.job.id === jobId);
  }, [jobId, savedJobsData]);

  const toggleSaved = useCallback(async () => {
    if (jobId === undefined) return;

    if (!isAuthenticated) {
      toast.info("Sign in to save jobs");
      return;
    }

    if (hasSaved) {
      unsaveJobMutation.mutate(jobId);
    } else {
      saveJobMutation.mutate(jobId);
    }
  }, [jobId, hasSaved, saveJobMutation, unsaveJobMutation, isAuthenticated]);

  return { hasSaved, toggleSaved };
}
