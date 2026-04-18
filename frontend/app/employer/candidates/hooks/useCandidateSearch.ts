import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { searchCandidates } from "@/lib/api/candidates";
import type {
  CandidatePreview,
  CandidateSortBy,
  CandidateSortOrder,
} from "@/types/candidate";
import type { PaginationMeta } from "@/lib/types";

type UseCandidateSearchParams = {
  skills: string[];
  location?: string;
  minYearsExperience?: number | null;
  openToWork?: boolean;
  page: number;
  limit: number;
  sortBy: CandidateSortBy;
  sortOrder?: CandidateSortOrder;
};

type UseCandidateSearchResult = {
  data: CandidatePreview[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useCandidateSearch(
  params: UseCandidateSearchParams,
): UseCandidateSearchResult {
  const {
    skills,
    location,
    minYearsExperience,
    openToWork,
    page,
    limit,
    sortBy,
    sortOrder,
  } = params;

  const query = useQuery({
    queryKey: [
      "candidate-search",
      {
        skills,
        location: location ?? "",
        minYearsExperience: minYearsExperience ?? null,
        openToWork: openToWork ?? false,
        page,
        limit,
        sortBy,
        sortOrder: sortOrder ?? null,
      },
    ],
    queryFn: () =>
      searchCandidates({
        skills,
        location: location?.trim() ? location.trim() : undefined,
        minYearsExperience: minYearsExperience ?? undefined,
        openToWork: openToWork ? true : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      }),
    placeholderData: keepPreviousData,
  });

  const response = query.data;
  const data =
    response && response.success ? (response.data as CandidatePreview[]) : [];
  const pagination = response && response.success ? response.pagination : null;

  return {
    data,
    pagination,
    isLoading: query.isLoading || query.isFetching,
    isError: query.isError || (response !== undefined && !response.success),
    refetch: () => {
      void query.refetch();
    },
  };
}
