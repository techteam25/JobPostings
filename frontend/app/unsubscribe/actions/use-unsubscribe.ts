import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";
import { ApiResponse, UnsubscribeInfo } from "@/lib/types";
import { toast } from "sonner";

export const useUnsubscribeInfo = (token: string | null) => {
  return useQuery({
    queryKey: ["unsubscribe-info", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");
      const response = await instance.get<ApiResponse<UnsubscribeInfo>>(
        `/users/me/email-preferences/unsubscribe/${token}/info`,
      );
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });
};

export const useUnsubscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await instance.post<
        ApiResponse<UnsubscribeInfo["preferences"]>
      >(`/users/me/email-preferences/unsubscribe/${token}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Unsubscribed successfully");
      queryClient.invalidateQueries({ queryKey: ["unsubscribe-info"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unsubscribe. Please try again.");
    },
  });
};
