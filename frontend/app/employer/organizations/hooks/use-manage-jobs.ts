import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";
import type { CreateJobInput, UpdateJobInput } from "@/lib/types";

export const useCreateJob = (organizationId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateJobInput) => {
      const response = await instance.post(
        "/jobs",
        {
          ...data,
          employerId: organizationId,
        },
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-jobs", organizationId],
      });
      toast.success("Job posted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create job");
    },
  });
};

export const useDeleteJob = (organizationId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: number) => {
      const response = await instance.delete(`/jobs/${jobId}`, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-jobs", organizationId],
      });
      toast.success("Job deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete job");
    },
  });
};

export const useUpdateJob = (organizationId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId,
      data,
    }: {
      jobId: number;
      data: UpdateJobInput;
    }) => {
      const response = await instance.put(`/jobs/${jobId}`, data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-jobs", organizationId],
      });
      toast.success("Job updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update job");
    },
  });
};
