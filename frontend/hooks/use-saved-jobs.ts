"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedJobsApi } from "@/lib/api/client/saved-jobs";
import type {
  ApiResponse,
  PaginatedApiResponse,
  SavedJob,
  SavedState,
} from "@/lib/types";

export const useSavedJobs = (
  initialData?: PaginatedApiResponse<SavedJob>,
) => {
  return useQuery({
    queryKey: ["saved-jobs"],
    queryFn: savedJobsApi.getSavedJobs,
    initialData,
  });
};

export const useIsJobSaved = (jobId: number | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: ["saved-job-check", jobId],
    queryFn: () => savedJobsApi.checkIfSaved(jobId!),
    enabled: !!jobId,
  });

  const isSaved = data?.success === true && data.data.isSaved;

  return { isSaved, isLoading };
};

export const useSaveJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savedJobsApi.saveJob,
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({
        queryKey: ["saved-job-check", jobId],
      });

      const previousData = queryClient.getQueryData<ApiResponse<SavedState>>([
        "saved-job-check",
        jobId,
      ]);

      queryClient.setQueryData<ApiResponse<SavedState>>(
        ["saved-job-check", jobId],
        { success: true, data: { isSaved: true } },
      );

      return { previousData, jobId };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["saved-job-check", context.jobId],
          context.previousData,
        );
      }
      toast.error("Failed to save job");
    },
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      queryClient.invalidateQueries({
        queryKey: ["saved-job-check", jobId],
      });
    },
  });
};

export const useUnsaveJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savedJobsApi.unsaveJob,
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({
        queryKey: ["saved-job-check", jobId],
      });
      await queryClient.cancelQueries({ queryKey: ["saved-jobs"] });

      const previousCheckData = queryClient.getQueryData<
        ApiResponse<SavedState>
      >(["saved-job-check", jobId]);

      const previousSavedJobs = queryClient.getQueryData<
        PaginatedApiResponse<SavedJob>
      >(["saved-jobs"]);

      queryClient.setQueryData<ApiResponse<SavedState>>(
        ["saved-job-check", jobId],
        { success: true, data: { isSaved: false } },
      );

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

      return { previousCheckData, previousSavedJobs, jobId };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previousCheckData) {
        queryClient.setQueryData(
          ["saved-job-check", context.jobId],
          context.previousCheckData,
        );
      }
      if (context?.previousSavedJobs) {
        queryClient.setQueryData(["saved-jobs"], context.previousSavedJobs);
      }
      toast.error("Failed to remove saved job");
    },
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      queryClient.invalidateQueries({
        queryKey: ["saved-job-check", jobId],
      });
    },
  });
};

export function useToggleSavedJob(jobId: number | undefined) {
  const { isSaved: hasSaved } = useIsJobSaved(jobId);
  const saveJobMutation = useSaveJobMutation();
  const unsaveJobMutation = useUnsaveJobMutation();

  const toggleSaved = useCallback(async () => {
    if (jobId === undefined) return;

    if (hasSaved) {
      unsaveJobMutation.mutate(jobId);
    } else {
      saveJobMutation.mutate(jobId);
    }
  }, [jobId, hasSaved, saveJobMutation, unsaveJobMutation]);

  return { hasSaved, toggleSaved };
}
