import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = 6;

/**
 * Skeleton placeholder shown while the search query is in flight.
 *
 * Mirrors the structure of a single `JobCard` so the page doesn't reflow when
 * real results arrive. The parent (`SearchJobsWrapper`) already renders the
 * results summary and sort controls above the list, so this component only
 * renders the card rows — duplicating the header would double-draw the sort
 * toolbar during loading.
 */
export function SearchLoadingState() {
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-busy="true"
      aria-label="Loading search results"
    >
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <div
          key={i}
          className="bg-card flex items-start gap-3 rounded-lg border p-4"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      ))}
      <span className="sr-only">Loading search results…</span>
    </div>
  );
}
