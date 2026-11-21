import { useQuery } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import type { ApiResponse } from "@/lib/types";

export type ProfileUploadStatus = {
  status: "queued" | "processing" | "completed" | "failed";
  url?: string;
  message?: string;
};

export function useProfileUploadStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["profile-upload-job", jobId],
    queryFn: async () => {
      const response = await instance.get<ApiResponse<ProfileUploadStatus>>(
        `/users/me/uploads/${encodeURIComponent(jobId!)}`,
        { withCredentials: true },
      );
      if (!response.data.success) {
        throw new Error("Could not check upload status");
      }
      return response.data.data;
    },
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      // Stop on a persistent API error; the user can explicitly retry.
      if (query.state.status === "error") return false;
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
    retry: 2,
  });
}
