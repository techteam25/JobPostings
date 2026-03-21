import { instance } from "@/lib/axios-instance";
import type {
  ApiResponse,
  PaginatedApiResponse,
  SavedJob,
  SavedState,
} from "@/lib/types";

export const savedJobsApi = {
  getSavedJobs: async (): Promise<PaginatedApiResponse<SavedJob>> => {
    const response =
      await instance.get<PaginatedApiResponse<SavedJob>>(
        "/users/me/saved-jobs/",
      );
    return response.data;
  },

  checkIfSaved: async (jobId: number): Promise<ApiResponse<SavedState>> => {
    const response = await instance.get<ApiResponse<SavedState>>(
      `/users/me/saved-jobs/${jobId}/check`,
    );
    return response.data;
  },

  saveJob: async (jobId: number): Promise<ApiResponse<SavedState>> => {
    const response = await instance.post<ApiResponse<SavedState>>(
      `/users/me/saved-jobs/${jobId}`,
    );
    return response.data;
  },

  unsaveJob: async (jobId: number): Promise<ApiResponse<void>> => {
    const response = await instance.delete<ApiResponse<void>>(
      `/users/me/saved-jobs/${jobId}`,
    );
    return response.data;
  },
};
