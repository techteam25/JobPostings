import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";
import type { ApiResponse, Organization } from "@/lib/types";

export const useUploadLogo = (organizationId: number) => {
  const queryClient = useQueryClient();
  const queryKey = ["fetch-organization", String(organizationId)];

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await instance.post(
        `/organizations/${organizationId}/logo`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      return response.data;
    },
    onMutate: async (file: File) => {
      // Cancel in-flight refetches so they don't overwrite our optimistic blob URL
      await queryClient.cancelQueries({ queryKey });

      // Snapshot for rollback on error
      const previous =
        queryClient.getQueryData<ApiResponse<Organization>>(queryKey);

      // Optimistically show the new logo immediately
      const blobUrl = URL.createObjectURL(file);
      queryClient.setQueryData<ApiResponse<Organization>>(queryKey, (old) => {
        if (!old || !("data" in old)) return old;
        return { ...old, data: { ...old.data, logoUrl: blobUrl } };
      });

      return { previous, blobUrl };
    },
    onSuccess: (_data, _file, context) => {
      // No cache revalidation — the upload is async (BullMQ worker).
      // Revalidating now would overwrite the optimistic blob URL with stale
      // DB data. The worker invalidates the backend cache after the DB
      // update, and the real Firebase URL appears on the next page load.
      if (context?.blobUrl) URL.revokeObjectURL(context.blobUrl);
      toast.success("Logo uploaded successfully");
    },
    onError: (error: Error, _file, context) => {
      // Restore previous cache value instantly instead of refetching
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      if (context?.blobUrl) URL.revokeObjectURL(context.blobUrl);
      toast.error(error.message || "Failed to upload logo");
    },
  });
};
