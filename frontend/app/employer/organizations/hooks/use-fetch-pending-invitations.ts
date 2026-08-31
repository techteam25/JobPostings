import { useQuery } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import type { ApiResponse, PendingInvitation } from "@/lib/types";

export const pendingInvitationsQueryKey = (organizationId: number) =>
  ["pending-invitations", String(organizationId)] as const;

export const useFetchPendingInvitations = (
  organizationId: number,
  enabled = true,
) => {
  const { data, error, isFetching } = useQuery({
    queryKey: pendingInvitationsQueryKey(organizationId),
    queryFn: async () => {
      const response = await instance.get<ApiResponse<PendingInvitation[]>>(
        `/organizations/${organizationId}/invitations`,
        { withCredentials: true },
      );
      return response.data;
    },
    enabled: enabled && !!organizationId,
  });

  if (!data?.success) {
    return {
      pendingInvitations: [] as PendingInvitation[],
      error: data?.message || "Could not fetch pending invitations.",
      isFetching,
    };
  }

  return {
    pendingInvitations: data.data,
    error,
    isFetching,
  };
};
