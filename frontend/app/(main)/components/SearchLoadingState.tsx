import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_ROWS = 6;

/**
 * Skeleton placeholder shown while job results are loading.
 *
 * Mirrors the structure of a single `JobCard` so the page doesn't reflow when
 * real results arrive. Used for both initial page load (6 rows) and infinite
 * scroll next-page loading (3 rows).
 */
export function SearchLoadingState({
  count = DEFAULT_ROWS,
}: {
  count?: number;
}) {
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-busy="true"
      aria-label="Loading search results"
    >
      {Array.from({ length: count }).map((_, i) => (
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
