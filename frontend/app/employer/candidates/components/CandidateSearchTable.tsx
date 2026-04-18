"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  SearchEmptyState,
  SearchErrorState,
  SearchLoadingState,
} from "@/components/common";

import {
  useCandidateSearchStore,
  useCandidateSearchStoreHydration,
} from "@/context/candidate-search-store";
import type { CandidateSortBy, CandidateSortOrder } from "@/types/candidate";

import { useCandidateSearch } from "../hooks/useCandidateSearch";
import { candidateColumns } from "./candidate-columns";
import { CandidateFiltersBar } from "./CandidateFiltersBar";

const COLUMN_TO_SORT_FIELD: Record<string, CandidateSortBy> = {
  name: "name",
  yearsOfExperience: "yearsOfExperience",
};

/**
 * Defer the table tree to after client mount. Vaul's Drawer and Radix
 * components emit different `useId()` counts between SSR and CSR; rendering
 * nothing on the server avoids the hydration mismatch entirely. Filter state
 * is client-only (persisted Zustand), so the server has no useful content to
 * render here anyway.
 */
const EMPTY_SUBSCRIBE = () => () => {};
const GET_CLIENT_SNAPSHOT = () => true;
const GET_SERVER_SNAPSHOT = () => false;

export function CandidateSearchTable() {
  const mounted = useSyncExternalStore(
    EMPTY_SUBSCRIBE,
    GET_CLIENT_SNAPSHOT,
    GET_SERVER_SNAPSHOT,
  );

  if (!mounted) {
    return <CandidateSearchTableSkeleton />;
  }

  return <CandidateSearchTableBody />;
}

function CandidateSearchTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card h-32 animate-pulse rounded-lg border" />
      <div className="bg-card h-64 animate-pulse rounded-lg border" />
    </div>
  );
}

function CandidateSearchTableBody() {
  // Triggers manual rehydration of the persisted Zustand store after mount —
  // required because the store uses `skipHydration: true` to keep SSR and the
  // first client render in sync (see `context/candidate-search-store.ts`).
  useCandidateSearchStoreHydration();

  const { skills, location, minYearsExperience, openToWork, clearFilters } =
    useCandidateSearchStore();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Reset to page 1 when filters change (render-phase derived state —
  // avoids cascading effects; safe under React 19 & Strict Mode).
  // JSON.stringify gives a collision-free serialization (skill names can
  // legitimately contain "|" or "::", which a manual delimiter string
  // would collide on).
  const filtersKey = JSON.stringify({
    skills,
    location,
    minYearsExperience: minYearsExperience ?? null,
    openToWork,
  });
  const [lastFiltersKey, setLastFiltersKey] = useState(filtersKey);
  if (filtersKey !== lastFiltersKey) {
    setLastFiltersKey(filtersKey);
    if (pagination.pageIndex !== 0) {
      setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    }
  }

  const { sortBy, sortOrder } = useMemo<{
    sortBy: CandidateSortBy;
    sortOrder?: CandidateSortOrder;
  }>(() => {
    const first = sorting[0];
    if (!first) return { sortBy: "relevant" };
    const mapped = COLUMN_TO_SORT_FIELD[first.id];
    if (!mapped) return { sortBy: "relevant" };
    return { sortBy: mapped, sortOrder: first.desc ? "desc" : "asc" };
  }, [sorting]);

  const {
    data,
    pagination: meta,
    isLoading,
    isError,
    refetch,
  } = useCandidateSearch({
    skills,
    location,
    minYearsExperience,
    openToWork,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy,
    sortOrder,
  });

  const pageCount = meta ? meta.totalPages : -1;
  const total = meta?.total ?? 0;
  const currentPage = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const showingFrom = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col gap-4">
      <CandidateFiltersBar />

      <div className="bg-card overflow-hidden rounded-lg border">
        {isLoading && data.length === 0 ? (
          <div className="p-4">
            <SearchLoadingState count={6} />
          </div>
        ) : isError ? (
          <SearchErrorState onRetry={refetch} />
        ) : data.length === 0 ? (
          <SearchEmptyState
            onClearFilters={clearFilters}
            title="No matching candidates"
            description="No public candidate profiles match your filters. Try broadening your skill list or clearing filters."
          />
        ) : (
          <>
            <DataTable
              columns={candidateColumns}
              data={data}
              manualPagination
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              pageCount={pageCount}
              onPaginationChange={setPagination}
              manualSorting
              sorting={sorting}
              onSortingChange={setSorting}
            />
            <div className="flex flex-col items-center justify-between gap-3 border-t p-3 md:flex-row">
              <span className="text-muted-foreground text-xs">
                {total === 0
                  ? "No results"
                  : `Showing ${showingFrom}–${showingTo} of ${total}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta?.hasPrevious}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      pageIndex: Math.max(0, prev.pageIndex - 1),
                    }))
                  }
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-muted-foreground text-xs tabular-nums">
                  Page {currentPage}
                  {pageCount > 0 ? ` of ${pageCount}` : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta?.hasNext}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      pageIndex: prev.pageIndex + 1,
                    }))
                  }
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
