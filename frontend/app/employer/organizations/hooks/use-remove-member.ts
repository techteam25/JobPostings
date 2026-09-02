import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";

export const useRemoveMember = (organizationId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: number) => {
      const response = await instance.delete(
        `/organizations/${organizationId}/members/${memberId}`,
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fetch-organization", String(organizationId)],
      });
      toast.success("Member removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });
};
