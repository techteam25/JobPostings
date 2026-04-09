"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useFiltersStore } from "@/context/store";
import { useSearchJobs } from "@/app/(main)/hooks/use-search-jobs";
import { buildApiParams } from "@/lib/search-params";

import { JobsList } from "@/app/(main)/components/JobsList";
import { JobDetailPanel } from "@/app/(main)/components/JobDetailPanel";
import { JobDetailPanelMobile } from "@/app/(main)/components/JobDetailPanelMobile";
import { SearchJobsList } from "@/app/(main)/components/SearchJobsList";
import { SortByDropDownButton } from "./SortByDropDownButton";
import { SortByMobileButton } from "./SortByMobileButton";
import {
  EmptyMuted,
  JobDetailPanelSkeleton,
  JobsListSkeleton,
} from "./JobsWrapper";

import type { PaginatedApiResponse } from "@/lib/types";
import type { JobWithEmployer } from "@/schemas/responses/jobs";

interface SearchJobsWrapperProps {
  initialJobs: PaginatedApiResponse<JobWithEmployer>;
}

/**
 * Main content for the "Search" tab. Owns two view modes:
 *   1. No search active -> render SSR-fetched `initialJobs` via `JobsList`.
 *   2. Search active -> render TanStack infinite-query results via
 *      `SearchJobsList`, with intersection-observer driven pagination.
 *
 * "Search active" is determined from the Zustand filter slice, which is the
 * same source used by `useSearchJobs` for query params — URL and store stay
 * in sync via the module-level subscribe in `context/store.ts`.
 */
export function SearchJobsWrapper({ initialJobs }: SearchJobsWrapperProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [jobId, setJobId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"Most Relevant" | "Most Recent">(
    "Most Recent",
  );
  const sentinelRef = useRef<HTMLDivElement>(null);

  const keyword = useFiltersStore((state) => state.keyword);
  const location = useFiltersStore((state) => state.location);
  const jobTypes = useFiltersStore((state) => state.jobTypes);
  const remoteOnly = useFiltersStore((state) => state.remoteOnly);
  const storeSortBy = useFiltersStore((state) => state.sortBy);
  const datePosted = useFiltersStore((state) => state.datePosted);

  // Mirrors the `enabled` check inside `useSearchJobs` so the wrapper can
  // decide which view to render without peeking at query internals.
  const isSearching =
    Object.keys(
      buildApiParams({
        keyword,
        location,
        jobTypes,
        remoteOnly,
        sortBy: storeSortBy,
        datePosted,
      }),
    ).length > 0;

  const {
    data: searchData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useSearchJobs();

  const searchResults = useMemo(
    () => searchData?.pages.flatMap((page) => page.data) ?? [],
    [searchData],
  );

  const searchTotal = searchData?.pages[0]?.pagination.total ?? 0;

  const handleJobSelect = useCallback((id: number) => {
    setJobId(id);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setJobId(undefined);
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort as "Most Relevant" | "Most Recent");
  }, []);

  // Resolve the default-selected job per-mode so the desktop detail panel
  // always has something to show when the list isn't empty.
  const firstJobId = isSearching
    ? searchResults.length > 0
      ? Number(searchResults[0].id)
      : undefined
    : initialJobs.data.length > 0
      ? initialJobs.data[0].job.id
      : undefined;

  const selectedJobId = jobId ?? (isDesktop ? firstJobId : undefined);
  const mobileOpen = !isDesktop && !!selectedJobId;

  // Infinite scroll: observe a sentinel div at the end of the list and
  // request the next page when it enters the viewport. Only active in search
  // mode, and only when there's a next page to fetch. Connecting to a
  // browser API is a legitimate effect — not state synchronization.
  useEffect(() => {
    if (!isSearching || !hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isSearching, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const summaryText = isSearching
    ? buildSearchSummary({
        total: searchTotal,
        keyword,
        location,
        isLoading: isSearchLoading,
      })
    : `${initialJobs.pagination.total} jobs`;

  const listContent = (() => {
    if (isSearching) {
      if (isSearchLoading) return <JobsListSkeleton />;
      if (isSearchError || searchResults.length === 0) return <EmptyMuted />;
      return (
        <>
          <SearchJobsList
            data={searchResults}
            onJobSelected={handleJobSelect}
            selectedId={selectedJobId}
          />
          {hasNextPage && (
            <div
              ref={sentinelRef}
              className="flex justify-center py-4"
              aria-hidden
            >
              {isFetchingNextPage && (
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
              )}
            </div>
          )}
        </>
      );
    }

    if (initialJobs.data.length === 0) return <EmptyMuted />;
    return (
      <Suspense fallback={<JobsListSkeleton />}>
        <JobsList
          data={initialJobs.data}
          onJobSelected={handleJobSelect}
          selectedId={selectedJobId}
        />
      </Suspense>
    );
  })();

  return (
    <main className="mx-auto max-w-7xl px-1 py-4 lg:px-4 lg:py-6">
      <div className="flex gap-4">
        <div className="w-full space-y-1.5 lg:w-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-secondary-foreground mr-4 truncate text-sm text-ellipsis">
              {summaryText}
            </div>
            <SortByMobileButton
              defaultSort={sortBy}
              onSortChange={handleSortChange}
            />
            <SortByDropDownButton />
          </div>
          {listContent}
        </div>

        <JobDetailPanelMobile
          jobId={selectedJobId}
          open={mobileOpen}
          onOpenChange={handleOpenChange}
        />
        <div className="sticky top-0 hidden h-fit max-h-screen flex-1 pt-6 lg:block">
          <Suspense fallback={<JobDetailPanelSkeleton />}>
            <JobDetailPanel jobId={selectedJobId} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function buildSearchSummary({
  total,
  keyword,
  location,
  isLoading,
}: {
  total: number;
  keyword: string;
  location: string;
  isLoading: boolean;
}): string {
  if (isLoading) return "Searching...";

  const trimmedKeyword = keyword.trim();
  const trimmedLocation = location.trim();

  const subject = trimmedKeyword ? `${trimmedKeyword} jobs` : "jobs";
  const locationPart = trimmedLocation ? ` in ${trimmedLocation}` : "";

  return `${total} ${subject}${locationPart}`;
}
