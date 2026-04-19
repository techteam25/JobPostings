"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useFiltersStore } from "@/context/store";
import { useSearchJobs } from "@/app/(main)/hooks/use-search-jobs";
import { useDefaultJobs } from "@/app/(main)/hooks/use-default-jobs";
import { buildApiParams } from "@/lib/search-params";

import { JobsList } from "@/app/(main)/components/JobsList";
import { JobDetailPanel } from "@/app/(main)/components/JobDetailPanel";
import { JobDetailPanelMobile } from "@/app/(main)/components/JobDetailPanelMobile";
import { SearchJobsList } from "@/app/(main)/components/SearchJobsList";
import { SearchLoadingState } from "@/components/common/search-loading-state";
import {
  SearchEmptyState,
  SearchErrorState,
} from "@/components/common/search-empty-state";
import { SortByDropDownButton } from "./SortByDropDownButton";
import { SortByMobileButton } from "./SortByMobileButton";
import { EmptyMuted, JobDetailPanelSkeleton } from "./JobsWrapper";

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
  const sentinelRef = useRef<HTMLDivElement>(null);

  const keyword = useFiltersStore((state) => state.keyword);
  const location = useFiltersStore((state) => state.location);
  const jobTypes = useFiltersStore((state) => state.jobTypes);
  const serviceRoles = useFiltersStore((state) => state.serviceRoles);
  const remoteOnly = useFiltersStore((state) => state.remoteOnly);
  const storeSortBy = useFiltersStore((state) => state.sortBy);
  const setSortBy = useFiltersStore((state) => state.setSortBy);
  const datePosted = useFiltersStore((state) => state.datePosted);

  // Mirrors the `enabled` check inside `useSearchJobs` so the wrapper can
  // decide which view to render without peeking at query internals.
  const isSearching =
    Object.keys(
      buildApiParams({
        keyword,
        location,
        jobTypes,
        serviceRoles,
        remoteOnly,
        sortBy: storeSortBy,
        datePosted,
      }),
    ).length > 0;

  const {
    data: searchData,
    fetchNextPage: fetchNextSearchPage,
    hasNextPage: searchHasNextPage,
    isFetchingNextPage: isSearchFetchingNextPage,
    isLoading: isSearchLoading,
    isError: isSearchError,
    refetch: refetchSearch,
  } = useSearchJobs();

  const {
    data: defaultData,
    fetchNextPage: fetchNextDefaultPage,
    hasNextPage: defaultHasNextPage,
    isFetchingNextPage: isDefaultFetchingNextPage,
  } = useDefaultJobs(initialJobs, { enabled: !isSearching });

  const searchResults = useMemo(
    () => searchData?.pages.flatMap((page) => page.data) ?? [],
    [searchData],
  );

  const defaultJobs = useMemo(
    () => defaultData?.pages.flatMap((page) => page.data) ?? [],
    [defaultData],
  );

  const searchTotal = searchData?.pages[0]?.pagination.total ?? 0;

  // Active query values — the observer and indicators delegate to whichever
  // mode is currently visible.
  const activeHasNextPage = isSearching
    ? searchHasNextPage
    : defaultHasNextPage;
  const activeFetchNextPage = isSearching
    ? fetchNextSearchPage
    : fetchNextDefaultPage;
  const activeIsFetchingNextPage = isSearching
    ? isSearchFetchingNextPage
    : isDefaultFetchingNextPage;
  const activePageCount = isSearching
    ? (searchData?.pages.length ?? 0)
    : (defaultData?.pages.length ?? 0);
  const activeResults = isSearching ? searchResults : defaultJobs;

  const handleJobSelect = useCallback((id: number) => {
    setJobId(id);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setJobId(undefined);
  }, []);

  const handleSortChange = useCallback(
    (label: string) => {
      setSortBy(label === "Most Relevant" ? "relevant" : "recent");
    },
    [setSortBy],
  );

  // Resets every searchable Zustand field in a single batched update. The
  // store's module-level subscriber then flushes the empty state to the URL
  // (after its 300ms debounce), so the component doesn't touch the router
  // directly. `serviceRoles` is cleared even though it isn't wired into the
  // search API yet — it's a visible filter chip, so users expect "Clear
  // filters" to zero it out too.
  const handleClearFilters = useCallback(() => {
    useFiltersStore.setState({
      keyword: "",
      location: "",
      jobTypes: [],
      serviceRoles: [],
      remoteOnly: false,
      sortBy: "recent",
      datePosted: null,
    });
  }, []);

  const handleRetrySearch = useCallback(() => {
    refetchSearch();
  }, [refetchSearch]);

  // Resolve the default-selected job per-mode so the desktop detail panel
  // always has something to show when the list isn't empty.
  const firstJobId = isSearching
    ? searchResults.length > 0
      ? Number(searchResults[0].id)
      : undefined
    : defaultJobs.length > 0
      ? defaultJobs[0].job.id
      : undefined;

  const selectedJobId = jobId ?? (isDesktop ? firstJobId : undefined);
  const mobileOpen = !isDesktop && !!selectedJobId;

  // Infinite scroll: observe a sentinel div at the end of the list and
  // request the next page when it enters the viewport. Works for both default
  // and search modes via the active-query values. Connecting to a browser API
  // is a legitimate effect — not state synchronization.
  useEffect(() => {
    if (!activeHasNextPage || activeIsFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          activeFetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeHasNextPage, activeIsFetchingNextPage, activeFetchNextPage]);

  const summaryText = isSearching
    ? buildSearchSummary({
        total: searchTotal,
        keyword,
        location,
        isLoading: isSearchLoading,
      })
    : null;

  const showNoMoreResults =
    !activeHasNextPage && activeResults.length > 0 && activePageCount > 1;

  const listContent = (() => {
    if (isSearching) {
      if (isSearchLoading) return <SearchLoadingState />;
      if (isSearchError)
        return <SearchErrorState onRetry={handleRetrySearch} />;
      if (searchResults.length === 0)
        return (
          <SearchEmptyState
            onClearFilters={handleClearFilters}
            title="No matching jobs"
            description="We couldn't find any jobs that match your search. Try adjusting your keywords, location, or filters."
          />
        );
      return (
        <SearchJobsList
          data={searchResults}
          onJobSelected={handleJobSelect}
          selectedId={selectedJobId}
        />
      );
    }

    if (defaultJobs.length === 0) return <EmptyMuted />;
    return (
      <Suspense fallback={<SearchLoadingState />}>
        <JobsList
          data={defaultJobs}
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
            {summaryText && (
              <div className="text-secondary-foreground mr-4 truncate text-sm text-ellipsis">
                {summaryText}
              </div>
            )}
            <SortByMobileButton
              defaultSort={
                storeSortBy === "relevant" ? "Most Relevant" : "Most Recent"
              }
              onSortChange={handleSortChange}
            />
            <SortByDropDownButton />
          </div>
          {listContent}
          {activeHasNextPage && (
            <div ref={sentinelRef} aria-hidden="true">
              {activeIsFetchingNextPage && <SearchLoadingState count={3} />}
            </div>
          )}
          {showNoMoreResults && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No more results
            </p>
          )}
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
