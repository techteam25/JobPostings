import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import type { ApiResponse, UserWithProfile } from "@/lib/types";

/** Sentinel value used as optimistic resumeUrl before the worker sets the real one. */
const OPTIMISTIC_RESUME_URL = "pending:resume-upload";

export const useUploadResume = () => {
  const queryClient = useQueryClient();
  const queryKey = ["current-user-profile"];

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("resume", file);
      const response = await instance.post("/users/me/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      return response.data;
    },
    onMutate: async (file: File) => {
      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<ApiResponse<UserWithProfile>>(queryKey);

      // Optimistically update the cache so the UI shows the file info
      // immediately instead of "No resume uploaded".
      queryClient.setQueryData<ApiResponse<UserWithProfile>>(
        queryKey,
        (old) => {
          if (!old || !("data" in old) || !old.data.profile) return old;

          const existingMetadata = old.data.profile.fileMetadata ?? [];

          return {
            ...old,
            data: {
              ...old.data,
              profile: {
                ...old.data.profile,
                resumeUrl: OPTIMISTIC_RESUME_URL,
                fileMetadata: [
                  ...existingMetadata,
                  {
                    url: OPTIMISTIC_RESUME_URL,
                    filename: file.name,
                    size: file.size,
                    mimetype: file.type,
                    uploadedAt: new Date().toISOString(),
                  },
                ],
              },
            },
          };
        },
      );

      return { previous };
    },
    onSuccess: () => {
      // No server cache revalidation — the upload is async (BullMQ worker).
      // The worker invalidates the backend cache after the DB update,
      // and the real Firebase URL appears on the next page load.
      toast.success("Resume uploaded successfully");
    },
    onError: (error: Error, _file, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(error.message || "Failed to upload resume");
    },
  });
};

export { OPTIMISTIC_RESUME_URL };
