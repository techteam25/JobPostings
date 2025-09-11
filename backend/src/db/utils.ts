import { SQL, sql } from 'drizzle-orm';
import { MySqlColumn } from 'drizzle-orm/mysql-core';
import { db } from './connection';

/**
 * Build pagination SQL with LIMIT and OFFSET
 */
export function buildPagination(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  return {
    limit: sql`LIMIT ${limit}`,
    offset: sql`OFFSET ${offset}`,
    page,
    limit,
    offset,
  };
}

/**
 * Build search conditions for text fields
 */
export function buildSearchCondition(
  columns: MySqlColumn[], 
  searchTerm: string
): SQL | undefined {
  if (!searchTerm.trim()) return undefined;
  
  const conditions = columns.map(column => 
    sql`${column} LIKE ${`%${searchTerm}%`}`
  );
  
  return sql`(${sql.join(conditions, sql` OR `)})`;
}

/**
 * Count total records for pagination
 */
export async function countRecords(
  table: any, 
  whereCondition?: SQL
): Promise<number> {
  const query = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(table);
    
  if (whereCondition) {
    query.where(whereCondition);
  }
  
  const result = await query;
  return result[0]?.count || 0;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  totalRecords: number,
  currentPage: number,
  limit: number
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

/**
 * Handle database errors and convert to user-friendly messages
 */
export function handleDatabaseError(error: unknown): {
  message: string;
  code?: string;
  statusCode: number;
} {
  if (error instanceof Error) {
    // MySQL specific error codes
    const mysqlError = error as any;
    
    switch (mysqlError.code) {
      case 'ER_DUP_ENTRY':
        return {
          message: 'Record already exists',
          code: 'DUPLICATE_ENTRY',
          statusCode: 409,
        };
      case 'ER_NO_REFERENCED_ROW_2':
        return {
          message: 'Referenced record does not exist',
          code: 'FOREIGN_KEY_CONSTRAINT',
          statusCode: 400,
        };
      case 'ER_ROW_IS_REFERENCED_2':
        return {
          message: 'Cannot delete record as it is referenced by other records',
          code: 'FOREIGN_KEY_CONSTRAINT',
          statusCode: 409,
        };
      case 'ER_DATA_TOO_LONG':
        return {
          message: 'Data too long for field',
          code: 'DATA_TOO_LONG',
          statusCode: 400,
        };
      case 'ER_BAD_NULL_ERROR':
        return {
          message: 'Required field cannot be null',
          code: 'NULL_CONSTRAINT',
          statusCode: 400,
        };
      default:
        return {
          message: error.message || 'Database operation failed',
          code: mysqlError.code || 'DATABASE_ERROR',
          statusCode: 500,
        };
    }
  }
  
  return {
    message: 'Unknown database error',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}

/**
 * Transaction wrapper with automatic rollback on error
 */
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    try {
      return await callback(tx);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  });
}
