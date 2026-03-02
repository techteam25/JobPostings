import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";

export const useUploadLogo = (organizationId: number) => {
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fetch-organization", String(organizationId)],
      });
      toast.success("Logo uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload logo");
    },
  });
};
