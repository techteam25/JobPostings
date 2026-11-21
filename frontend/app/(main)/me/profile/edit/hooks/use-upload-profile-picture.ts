import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import type { ApiResponse, UserWithProfile } from "@/lib/types";
import { useProfileUploadStatus } from "./use-profile-upload-status";

type QueuedUpload = { jobId: string; status: "queued"; message: string };

export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const handledJobRef = useRef<string | null>(null);
  const status = useProfileUploadStatus(jobId);
  const isTerminal =
    status.data?.status === "completed" || status.data?.status === "failed";

  const clearPreview = useCallback(() => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreviewUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  useEffect(() => {
    if (!jobId || !status.data || handledJobRef.current === jobId) return;

    if (status.data.status === "completed") {
      handledJobRef.current = jobId;
      if (status.data.url) {
        queryClient.setQueryData<ApiResponse<UserWithProfile>>(
          ["current-user-profile"],
          (old) => {
            if (!old?.success || !old.data.profile) return old;
            return {
              ...old,
              data: {
                ...old.data,
                profile: {
                  ...old.data.profile,
                  profilePicture: status.data!.url!,
                },
              },
            };
          },
        );
      }
      void queryClient.refetchQueries({ queryKey: ["current-user-profile"] });
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
      toast.success("Profile picture uploaded successfully");
    } else if (status.data.status === "failed") {
      handledJobRef.current = jobId;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
      toast.error(
        status.data.message || "Profile picture upload failed. Please retry.",
      );
    }
  }, [jobId, queryClient, status.data]);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const response = await instance.post<ApiResponse<QueuedUpload>>(
        "/users/me/profile-picture",
        formData,
        { withCredentials: true },
      );
      if (!response.data.success)
        throw new Error("Could not queue profile picture upload");
      return response.data.data;
    },
    onMutate: (file) => {
      setJobId(null);
      clearPreview();
      const blobUrl = URL.createObjectURL(file);
      previewRef.current = blobUrl;
      setPreviewUrl(blobUrl);
    },
    onSuccess: (data) => {
      handledJobRef.current = null;
      setJobId(data.jobId);
      toast.info("Profile picture queued for upload");
    },
    onError: (error: Error) => {
      clearPreview();
      toast.error(error.message || "Failed to upload profile picture");
    },
  });

  return {
    ...mutation,
    previewUrl: isTerminal ? null : previewUrl,
    isProcessing: Boolean(jobId && !isTerminal),
    processingStatus: status.data?.status ?? "queued",
    statusError: status.error,
    retryStatus: status.refetch,
  };
};
