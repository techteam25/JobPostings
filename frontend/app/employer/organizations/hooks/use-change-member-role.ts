import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";
import type { AssignableMemberRole } from "@/schemas/invitations";

export const useChangeMemberRole = (organizationId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: number;
      role: AssignableMemberRole;
    }) => {
      const response = await instance.patch(
        `/organizations/${organizationId}/members/${memberId}`,
        { role },
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fetch-organization", String(organizationId)],
      });
      toast.success("Member role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update member role");
    },
  });
};
