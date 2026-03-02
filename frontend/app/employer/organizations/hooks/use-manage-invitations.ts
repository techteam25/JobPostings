import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";
import type { SendInvitationInput } from "@/lib/types";

export const useSendInvitation = (organizationId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SendInvitationInput) => {
      const response = await instance.post(
        `/organizations/${organizationId}/invitations`,
        data,
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fetch-organization", String(organizationId)],
      });
      toast.success("Invitation sent successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to send invitation",
      );
    },
  });
};

export const useCancelInvitation = (organizationId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await instance.delete(
        `/organizations/${organizationId}/invitations/${invitationId}`,
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fetch-organization", String(organizationId)],
      });
      toast.success("Invitation cancelled");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to cancel invitation",
      );
    },
  });
};

export const useAcceptInvitation = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await instance.post(
        `/invitations/${token}/accept`,
        {},
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Invitation accepted! Welcome to the organization.");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to accept invitation",
      );
    },
  });
};
