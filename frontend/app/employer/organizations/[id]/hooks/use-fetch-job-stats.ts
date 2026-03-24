import { useQuery } from "@tanstack/react-query";
import { instance } from "@/lib/axios-instance";
import type { ApiResponse, OrganizationJobStats } from "@/lib/types";

export const useFetchJobStats = (organizationId: number) => {
  const { data, error, isFetching } = useQuery({
    queryKey: ["organization-job-stats", organizationId],
    queryFn: async () => {
      const response = await instance.get<ApiResponse<OrganizationJobStats>>(
        `/jobs/employer/${organizationId}/jobs/stats`,
      );
      return response.data;
    },
    enabled: !!organizationId,
  });

  if (!data?.success) {
    return {
      stats: null,
      error: data?.message || error?.message || null,
      isLoading: isFetching,
    };
  }

  return { stats: data.data, error: null, isLoading: isFetching };
};
