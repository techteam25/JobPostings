import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import {
  CreateJobAlertInput,
  UpdateJobAlertInput,
  PaginatedApiResponse,
  JobAlert,
} from "@/lib/types";

export const useJobAlerts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["job-alerts", page, limit],
    queryFn: async (): Promise<PaginatedApiResponse<JobAlert>> => {
      const response = await instance.get(
        `/users/me/job-alerts?page=${page}&limit=${limit}`,
        {
          withCredentials: true,
        },
      );
      return response.data;
    },
  });
};

export const useCreateJobAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateJobAlertInput) => {
      const response = await instance.post("/users/me/job-alerts", data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      toast.success("Job alert created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create job alert",
      );
    },
  });
};

export const useUpdateJobAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateJobAlertInput;
    }) => {
      const response = await instance.put(`/users/me/job-alerts/${id}`, data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      queryClient.invalidateQueries({
        queryKey: [`job-alert-${variables.id}`],
      });
      toast.success("Job alert updated");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update job alert",
      );
    },
  });
};

export const useDeleteJobAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await instance.delete(`/users/me/job-alerts/${id}`, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      toast.success("Job alert deleted");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete job alert",
      );
    },
  });
};

export const useTogglePauseJobAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPaused }: { id: number; isPaused: boolean }) => {
      const response = await instance.patch(
        `/users/me/job-alerts/${id}/pause`,
        { isPaused },
        {
          withCredentials: true,
        },
      );
      return response.data;
    },
    onSuccess: (_, { id, isPaused }) => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      queryClient.invalidateQueries({ queryKey: [`job-alert-${id}`] });
      toast.success(`Job alert ${isPaused ? "paused" : "resumed"}`);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update job alert status",
      );
    },
  });
};
