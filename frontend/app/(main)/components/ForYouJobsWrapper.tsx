"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ThumbsUp } from "lucide-react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useRecommendedJobs } from "@/app/(main)/hooks/use-recommended-jobs";

import { SearchJobsList } from "@/app/(main)/components/SearchJobsList";
import { SearchLoadingState } from "@/app/(main)/components/SearchLoadingState";
import { SearchErrorState } from "@/app/(main)/components/SearchEmptyState";
import { JobDetailPanel } from "@/app/(main)/components/JobDetailPanel";
import { JobDetailPanelMobile } from "@/app/(main)/components/JobDetailPanelMobile";
import { JobDetailPanelSkeleton } from "@/app/(main)/components/JobsWrapper";
import { ProfileCompletionNudge } from "@/app/(main)/components/ProfileCompletionNudge";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function ForYouJobsWrapper() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [jobId, setJobId] = useState<number | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    hasPersonalization,
  } = useRecommendedJobs();

  const results = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const pageCount = data?.pages.length ?? 0;

  const handleJobSelect = useCallback((id: number) => {
    setJobId(id);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setJobId(undefined);
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const firstJobId = results.length > 0 ? Number(results[0].id) : undefined;

  const selectedJobId = jobId ?? (isDesktop ? firstJobId : undefined);
  const mobileOpen = !isDesktop && !!selectedJobId;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const showNoMoreResults = !hasNextPage && results.length > 0 && pageCount > 1;

  const listContent = (() => {
    if (isLoading) return <SearchLoadingState />;
    if (isError) return <SearchErrorState onRetry={handleRetry} />;
    if (results.length === 0) return <RecommendationsEmptyState />;
    return (
      <SearchJobsList
        data={results}
        onJobSelected={handleJobSelect}
        selectedId={selectedJobId}
      />
    );
  })();

  return (
    <main className="mx-auto max-w-7xl px-1 py-4 lg:px-4 lg:py-6">
      <div className="flex gap-4">
        <div className="w-full space-y-1.5 lg:w-md">
          {!isLoading &&
            !isError &&
            results.length > 0 &&
            !hasPersonalization && <ProfileCompletionNudge />}
          {listContent}
          {hasNextPage && (
            <div ref={sentinelRef} aria-hidden="true">
              {isFetchingNextPage && <SearchLoadingState count={3} />}
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

function RecommendationsEmptyState() {
  return (
    <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ThumbsUp />
        </EmptyMedia>
        <EmptyTitle>No recommendations available</EmptyTitle>
        <EmptyDescription>
          There are no job recommendations at this time. Please check back
          later.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
