import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import type { ApiResponse } from "@/lib/types";
import { useProfileUploadStatus } from "./use-profile-upload-status";

type QueuedUpload = { jobId: string; status: "queued"; message: string };

export const useUploadResume = () => {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [pendingFilename, setPendingFilename] = useState<string | null>(null);
  const status = useProfileUploadStatus(jobId);
  const handledJobRef = useRef<string | null>(null);
  const isTerminal =
    status.data?.status === "completed" || status.data?.status === "failed";

  useEffect(() => {
    if (!jobId || !status.data || handledJobRef.current === jobId) return;

    if (status.data.status === "completed") {
      handledJobRef.current = jobId;
      void queryClient.refetchQueries({ queryKey: ["current-user-profile"] });
      toast.success("Resume uploaded successfully");
    } else if (status.data.status === "failed") {
      handledJobRef.current = jobId;
      toast.error(status.data.message || "Resume upload failed. Please retry.");
    }
  }, [jobId, queryClient, status.data]);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("resume", file);
      const response = await instance.post<ApiResponse<QueuedUpload>>(
        "/users/me/resume",
        formData,
        { withCredentials: true },
      );
      if (!response.data.success)
        throw new Error("Could not queue resume upload");
      return response.data.data;
    },
    onMutate: () => {
      setJobId(null);
      setPendingFilename(null);
    },
    onSuccess: (data, file) => {
      handledJobRef.current = null;
      setPendingFilename(file.name);
      setJobId(data.jobId);
      toast.info("Resume queued for upload");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload resume");
    },
  });

  return {
    ...mutation,
    pendingFilename: isTerminal ? null : pendingFilename,
    isProcessing: Boolean(jobId && !isTerminal),
    processingStatus: status.data?.status ?? "queued",
    statusError: status.error,
    retryStatus: status.refetch,
  };
};
