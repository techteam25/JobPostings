import { useQuery } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import type { ApiResponse, Organization } from "@/lib/types";

export const useFetchOrganization = (organizationId: string) => {
  const { error, data, isFetching } = useQuery({
    queryKey: ["fetch-organization", organizationId],
    queryFn: async () => {
      const response = await instance.get<ApiResponse<Organization>>(
        `/organizations/${organizationId}`,
      );
      return response.data;
    },
    enabled: !!organizationId,
  });

  if (!data?.success) {
    return {
      organization: null,
      error: data?.message || "Could not fetch organization at this time.",
      fetchingOrganization: isFetching,
    };
  }

  return { organization: data.data, error, fetchingOrganization: isFetching };
};
