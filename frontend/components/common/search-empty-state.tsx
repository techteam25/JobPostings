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
  title?: string;
  description?: string;
}

/**
 * Rendered when a search completes successfully but returns zero results.
 */
export function SearchEmptyState({
  onClearFilters,
  title = "No matching results",
  description = "We couldn't find any results that match your search. Try adjusting your keywords, location, or filters.",
}: SearchEmptyStateProps) {
  return (
    <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/**
 * Rendered when an unauthenticated user runs a search that returns zero
 * results. Nudges them to sign in for personalized recommendations instead of
 * surfacing a bare "Clear filters" dead-end.
 */
export function SearchJobsResultEmpty() {
  return (
    <main className="mx-auto max-w-7xl px-1 py-4 lg:px-4 lg:py-6">
      <Empty className="from-muted/50 to-background bg-linear-to-b from-30%">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle className="text-secondary-foreground text-sm md:text-base">
            We didn&apos;t find any matching jobs
          </EmptyTitle>
        </EmptyHeader>
        <Button asChild className="rounded-full"></Button>
      </Empty>
    </main>
  );
}

interface SearchErrorStateProps {
  onRetry: () => void;
}

/**
 * Rendered when the search query throws (network failure, backend 5xx, etc.).
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
