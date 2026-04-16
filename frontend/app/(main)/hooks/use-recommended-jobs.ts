"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getRecommendations } from "@/lib/api";

/**
 * Infinite-query hook for the "For You" recommendations tab.
 *
 * Unlike `useDefaultJobs`, this hook does NOT accept `initialData` for SSR
 * seeding — recommendations are purely client-fetched because they require
 * authentication and a profile lookup that makes SSR impractical.
 * The hook starts fetching on mount.
 */
export function useRecommendedJobs() {
  const query = useInfiniteQuery({
    queryKey: ["recommended-jobs"] as const,
    queryFn: async ({ pageParam }) => {
      const result = await getRecommendations({ page: pageParam });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.success) return undefined;
      if (!lastPage.pagination.hasNext) return undefined;
      return lastPage.pagination.nextPage ?? undefined;
    },
  });

  const hasPersonalization = query.data?.pages[0]?.hasPersonalization ?? false;

  return { ...query, hasPersonalization };
}
