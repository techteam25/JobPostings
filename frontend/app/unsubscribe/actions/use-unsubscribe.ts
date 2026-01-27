import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";
import { UnsubscribeInfo } from "@/lib/types";
import { toast } from "sonner";

export const useUnsubscribeInfo = (token: string | null) => {
  return useQuery({
    queryKey: ["unsubscribe-info", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");
      const response = await instance.get<{ data: UnsubscribeInfo }>(
        `/users/me/email-preferences/unsubscribe/${token}/info`,
      );
      return response.data.data;
    },
    enabled: !!token,
    retry: false,
  });
};

export const useUnsubscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await instance.post(
        `/users/me/email-preferences/unsubscribe/${token}`,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Unsubscribed successfully");
      queryClient.invalidateQueries({ queryKey: ["unsubscribe-info"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to unsubscribe. Please try again.",
      );
    },
  });
};
