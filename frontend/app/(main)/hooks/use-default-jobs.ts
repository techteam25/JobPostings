"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getJobs } from "@/lib/api";
import type { PaginatedApiResponse } from "@/lib/types";
import type { JobWithEmployer } from "@/schemas/responses/jobs";

/**
 * Infinite-query hook for the default (no-search) job listing.
 *
 * Seeded with SSR data from `getJobs()` so page 1 renders instantly without a
 * client-side fetch. Subsequent pages are fetched via the same `getJobs(page)`
 * server action when the user scrolls.
 */
export function useDefaultJobs(
  initialData: PaginatedApiResponse<JobWithEmployer>,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: ["jobs"] as const,
    queryFn: async ({ pageParam }) => {
      const result = await getJobs(pageParam);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    initialPageParam: 1,
    initialData: {
      pages: [initialData],
      pageParams: [1],
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasNext) return undefined;
      return lastPage.pagination.nextPage ?? undefined;
    },
    enabled: options?.enabled,
  });
}
