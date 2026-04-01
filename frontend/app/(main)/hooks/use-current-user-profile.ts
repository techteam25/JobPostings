import { useQuery } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";
import type { ApiResponse, UserWithProfile } from "@/lib/types";

export const useCurrentUserProfile = () => {
  return useQuery({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      const response = await instance.get<ApiResponse<UserWithProfile>>(
        "/users/me",
        {
          withCredentials: true,
        },
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
