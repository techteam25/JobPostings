import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import {
  CreateJobAlertInput,
  UpdateJobAlertInput,
  PaginatedApiResponse,
  JobAlert,
} from "@/lib/types";

export const useJobAlerts = (
  page = 1,
  limit = 10,
  initialData?: PaginatedApiResponse<JobAlert>,
) => {
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
    initialData: page === 1 && limit === 10 ? initialData : undefined,
    staleTime: 30_000,
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
    onSuccess: (result) => {
      const newAlert = result.data;
      
      queryClient.setQueriesData<PaginatedApiResponse<JobAlert>>(
        { queryKey: ["job-alerts"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [newAlert, ...old.data],
          };
        },
      );
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["job-alerts"] });
      await queryClient.cancelQueries({ queryKey: [`job-alert-${id}`] });

      const previousAlerts = queryClient.getQueriesData<
        PaginatedApiResponse<JobAlert>
      >({
        queryKey: ["job-alerts"],
      });

      queryClient.setQueriesData<PaginatedApiResponse<JobAlert>>(
        { queryKey: ["job-alerts"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((alert) =>
              alert.id === id ? { ...alert, ...data } : alert,
            ),
          };
        },
      );

      return { previousAlerts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousAlerts) {
        context.previousAlerts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to update job alert");
    },
    onSuccess: () => {
      toast.success("Job alert updated");
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["job-alerts"] });

      const previousAlerts = queryClient.getQueriesData<
        PaginatedApiResponse<JobAlert>
      >({
        queryKey: ["job-alerts"],
      });

      queryClient.setQueriesData<PaginatedApiResponse<JobAlert>>(
        { queryKey: ["job-alerts"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((alert) => alert.id !== id),
          };
        },
      );

      return { previousAlerts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousAlerts) {
        context.previousAlerts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to delete job alert");
    },
    onSuccess: () => {
      toast.success("Job alert deleted");
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
    onMutate: async ({ id, isPaused }) => {
      await queryClient.cancelQueries({ queryKey: ["job-alerts"] });
      await queryClient.cancelQueries({ queryKey: [`job-alert-${id}`] });

      const previousAlerts = queryClient.getQueriesData<
        PaginatedApiResponse<JobAlert>
      >({
        queryKey: ["job-alerts"],
      });

      queryClient.setQueriesData<PaginatedApiResponse<JobAlert>>(
        { queryKey: ["job-alerts"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((alert) =>
              alert.id === id ? { ...alert, isPaused } : alert,
            ),
          };
        },
      );

      return { previousAlerts };
    },
    onError: (_err, { isPaused }, context) => {
      if (context?.previousAlerts) {
        context.previousAlerts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to update job alert status");
    },
    onSuccess: (_, { isPaused }) => {
      toast.success(`Job alert ${isPaused ? "paused" : "resumed"}`);
    },
  });
};
