"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { searchJobs } from "@/lib/api/search-jobs";
import { useFiltersStore } from "@/context/store";
import { buildApiParams } from "@/lib/search-params";

/**
 * Infinite-query hook for the job search tab.
 *
 * Reads the searchable Zustand slice, converts it to API params via
 * `buildApiParams`, and only fires a request when at least one searchable
 * field is set. Throws on `success: false` so TanStack Query surfaces errors
 * through its `isError` channel instead of each consumer having to re-check.
 */
export function useSearchJobs() {
  const keyword = useFiltersStore((state) => state.keyword);
  const location = useFiltersStore((state) => state.location);
  const jobTypes = useFiltersStore((state) => state.jobTypes);
  const serviceRoles = useFiltersStore((state) => state.serviceRoles);
  const remoteOnly = useFiltersStore((state) => state.remoteOnly);
  const sortBy = useFiltersStore((state) => state.sortBy);
  const datePosted = useFiltersStore((state) => state.datePosted);

  const apiParams = buildApiParams({
    keyword,
    location,
    jobTypes,
    serviceRoles,
    remoteOnly,
    sortBy,
    datePosted,
  });

  const enabled = Object.keys(apiParams).length > 0;

  return useInfiniteQuery({
    queryKey: ["search-jobs", apiParams] as const,
    queryFn: async ({ pageParam }) => {
      const result = await searchJobs({ ...apiParams, page: pageParam });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasNext) return undefined;
      return lastPage.pagination.nextPage ?? undefined;
    },
    enabled,
  });
}
