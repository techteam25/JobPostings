import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import type { ApiResponse, UserWithProfile } from "@/lib/types";

export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const response = await instance.post(
        "/users/me/profile-picture",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      return response.data;
    },
    onMutate: (file: File) => {
      // Optimistically set the blob URL in the shared query cache so ALL
      // consumers (edit form avatar, desktop navbar, mobile sheet) show
      // the new picture immediately — no waiting for the async worker.
      const blobUrl = URL.createObjectURL(file);
      queryClient.setQueryData<ApiResponse<UserWithProfile>>(
        ["current-user-profile"],
        (old) => {
          if (!old || !("data" in old) || !old.data.profile) return old;
          return {
            ...old,
            data: {
              ...old.data,
              profile: { ...old.data.profile, profilePicture: blobUrl },
            },
          };
        },
      );
    },
    onSuccess: () => {
      // No server cache revalidation — the upload is async (BullMQ worker).
      // Revalidating now would overwrite the optimistic blob URL with stale
      // DB data. The worker invalidates the backend cache after the DB
      // update, and the real Firebase URL appears on the next page load.
      toast.success("Profile picture uploaded successfully");
    },
    onError: (error: Error) => {
      // Revert optimistic update on failure
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
      toast.error(error.message || "Failed to upload profile picture");
    },
  });
};
