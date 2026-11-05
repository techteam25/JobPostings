import { PaginationMeta } from "@shared/types";

export function buildPaginationMeta(
  searchResponse: { found: number; page: number },
  limit: number,
): PaginationMeta {
  const total = searchResponse.found;
  const page = searchResponse.page;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrevious,
    nextPage: hasNext ? page + 1 : null,
    previousPage: hasPrevious ? page - 1 : null,
  };
}
