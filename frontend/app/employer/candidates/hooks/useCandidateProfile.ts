import { useQuery } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import type { ApiResponse } from "@/lib/types";
import type { PublicCandidateProfile } from "@/types/candidate";

export function useCandidateProfile(userId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["candidate-profile", userId],
    queryFn: async () => {
      const response = await instance.get<ApiResponse<PublicCandidateProfile>>(
        `/organizations/candidates/${userId}`,
      );
      return response.data;
    },
    enabled: enabled && userId !== null,
  });
}
