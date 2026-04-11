"use client";

import { AlertTriangle, RefreshCcwIcon, SearchX } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

interface SearchEmptyStateProps {
  onClearFilters: () => void;
}

/**
 * Rendered when a search completes successfully but returns zero results.
 * The "Clear filters" action resets the Zustand search slice, which in turn
 * flushes the URL params via the store's subscribe hook.
 */
export function SearchEmptyState({ onClearFilters }: SearchEmptyStateProps) {
  return (
    <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>No matching jobs</EmptyTitle>
        <EmptyDescription>
          We couldn&apos;t find any jobs that match your search. Try adjusting
          your keywords, location, or filters.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}

interface SearchErrorStateProps {
  onRetry: () => void;
}

/**
 * Rendered when the search query throws (network failure, backend 5xx, etc.).
 * "Retry" calls `refetch()` from the TanStack Query instance so the same query
 * key is re-executed without touching filter state.
 */
export function SearchErrorState({ onRetry }: SearchErrorStateProps) {
  return (
    <Empty className="from-destructive/10 to-background h-full bg-linear-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangle />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>
          We couldn&apos;t load your search results. Check your connection and
          try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcwIcon />
          Retry
        </Button>
      </EmptyContent>
    </Empty>
  );
}
