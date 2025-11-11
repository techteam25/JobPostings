import { useQuery } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";

export const useGetUserProfileStatus = () => {
  const {
    data: status,
    isPending: isFetchingStatus,
    error: fetchProfileError,
  } = useQuery({
    queryKey: ["get-user-profile-status"],
    queryFn: async () => {
      const response = await instance<{ complete: boolean }>(
        "/users/me/status",
        {
          method: "GET",
        },
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { status, isFetchingStatus, fetchProfileError };
};
