import { count, type SQL } from "drizzle-orm";
import { db } from "@shared/db/connection";

/**
 * Count total records for pagination
 */
export async function countRecords(
  table: any,
  whereCondition?: SQL,
): Promise<number> {
  const query = db.select({ count: count() }).from(table);

  if (whereCondition) {
    query.where(whereCondition);
  }

  const [result] = await query;
  return result?.count || 0;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  totalRecords: number,
  currentPage: number,
  limit: number,
) {
  const totalPages = Math.ceil(totalRecords / limit);
  const hasNext = currentPage < totalPages;
  const hasPrevious = currentPage > 1;

  return {
    total: totalRecords,
    page: currentPage,
    limit,
    totalPages,
    hasNext,
    hasPrevious,
    nextPage: hasNext ? currentPage + 1 : null,
    previousPage: hasPrevious ? currentPage - 1 : null,
  };
}
