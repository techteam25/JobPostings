"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedJobsApi } from "@/lib/api/client/saved-jobs";
import type {
  PaginatedApiResponse,
  SavedJob,
} from "@/lib/types";
import type { JobResponse, JobWithEmployer } from "@/schemas/responses/jobs";

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
      await queryClient.cancelQueries({ queryKey: ["fetch-jobs"] });
      await queryClient.cancelQueries({ queryKey: ["job-details", jobId] });

      const previousJobs =
        queryClient.getQueryData<PaginatedApiResponse<JobWithEmployer>>([
          "fetch-jobs",
        ]);
      const previousJobDetail = queryClient.getQueryData<JobResponse>([
        "job-details",
        jobId,
      ]);

      // Optimistically update the jobs list
      queryClient.setQueryData<PaginatedApiResponse<JobWithEmployer>>(
        ["fetch-jobs"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.job.id === jobId ? { ...item, hasSaved: true } : item,
            ),
          };
        },
      );

      // Optimistically update the job detail
      queryClient.setQueryData<JobResponse>(["job-details", jobId], (old) => {
        if (!old || !old.success) return old;
        return { ...old, data: { ...old.data, hasSaved: true } };
      });

      return { previousJobs, previousJobDetail, jobId };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["fetch-jobs"], context.previousJobs);
      }
      if (context?.previousJobDetail) {
        queryClient.setQueryData(
          ["job-details", context.jobId],
          context.previousJobDetail,
        );
      }
      toast.error("Failed to save job");
    },
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["fetch-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-details", jobId] });
    },
  });
};

export const useUnsaveJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savedJobsApi.unsaveJob,
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: ["fetch-jobs"] });
      await queryClient.cancelQueries({ queryKey: ["job-details", jobId] });
      await queryClient.cancelQueries({ queryKey: ["saved-jobs"] });

      const previousJobs =
        queryClient.getQueryData<PaginatedApiResponse<JobWithEmployer>>([
          "fetch-jobs",
        ]);
      const previousJobDetail = queryClient.getQueryData<JobResponse>([
        "job-details",
        jobId,
      ]);
      const previousSavedJobs = queryClient.getQueryData<
        PaginatedApiResponse<SavedJob>
      >(["saved-jobs"]);

      // Optimistically update the jobs list
      queryClient.setQueryData<PaginatedApiResponse<JobWithEmployer>>(
        ["fetch-jobs"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.job.id === jobId ? { ...item, hasSaved: false } : item,
            ),
          };
        },
      );

      // Optimistically update the job detail
      queryClient.setQueryData<JobResponse>(["job-details", jobId], (old) => {
        if (!old || !old.success) return old;
        return { ...old, data: { ...old.data, hasSaved: false } };
      });

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

      return { previousJobs, previousJobDetail, previousSavedJobs, jobId };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["fetch-jobs"], context.previousJobs);
      }
      if (context?.previousJobDetail) {
        queryClient.setQueryData(
          ["job-details", context.jobId],
          context.previousJobDetail,
        );
      }
      if (context?.previousSavedJobs) {
        queryClient.setQueryData(["saved-jobs"], context.previousSavedJobs);
      }
      toast.error("Failed to remove saved job");
    },
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["fetch-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-details", jobId] });
    },
  });
};

export function useToggleSavedJob(
  jobId: number | undefined,
  hasSaved: boolean,
  isAuthenticated: boolean,
) {
  const saveJobMutation = useSaveJobMutation();
  const unsaveJobMutation = useUnsaveJobMutation();

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
