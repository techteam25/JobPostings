import logger from "@/logger";
import { DatabaseError } from "@/utils/errors";

/**
 * Common MySQL error codes mapped to user-friendly messages.
 * Extend this map for your own domain-specific cases.
 */
export const MYSQL_ERROR_MAP: Record<string, string> = {
  // Constraint violations
  ER_DUP_ENTRY: "Duplicate entry for a unique key",
  ER_BAD_NULL_ERROR: "Column cannot be null",
  ER_NO_REFERENCED_ROW_2: "Foreign key constraint failed",
  ER_ROW_IS_REFERENCED_2: "Cannot delete: record has dependent references",
  ER_CHECK_CONSTRAINT_VIOLATED: "Check constraint failed",
  ER_NO_DEFAULT_FOR_FIELD: "Missing required field without default",

  // Query & syntax
  ER_PARSE_ERROR: "SQL syntax error",
  ER_BAD_FIELD_ERROR: "Unknown column in query",
  ER_NO_SUCH_TABLE: "Table not found",
  ER_TABLE_EXISTS_ERROR: "Table already exists",
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: "Invalid value for column",
  ER_WARN_DATA_TRUNCATED: "Data truncated for column",

  // Connection & access
  ER_ACCESS_DENIED_ERROR: "Invalid database credentials",
  ER_BAD_DB_ERROR: "Database not found",
  ER_CON_COUNT_ERROR: "Too many active connections",
  CR_CONNECTION_ERROR: "Cannot connect to MySQL server",
  CR_SERVER_LOST: "Lost connection to MySQL server",

  // Locking
  ER_LOCK_DEADLOCK: "Transaction deadlock detected",
  ER_LOCK_WAIT_TIMEOUT: "Lock wait timeout exceeded",

  // Resource
  ER_RECORD_FILE_FULL: "Table is full (disk/memory limit)",
  ER_DATA_TOO_LONG: "Data too long for column",

  // Privilege
  ER_TABLEACCESS_DENIED_ERROR: "No permission to access table",
  ER_SPECIFIC_ACCESS_DENIED_ERROR: "Access denied",
};

/**
 * Maps a MySQL error (from mysql2 or Drizzle) to a DatabaseError instance.
 */
export function handleMySqlError(err: any): never {
  // Try both symbolic code and numeric errno
  const code = err?.code || `ER_${err?.errno}`;
  const friendlyMessage =
    MYSQL_ERROR_MAP[code as keyof typeof MYSQL_ERROR_MAP] ||
    err?.message ||
    "Unknown database error";

  logger.error({ friendlyMessage, err });

  throw new DatabaseError("Internal Server Error");
}

/**
 * Wrapper helper: runs an async DB operation and translates any MySQL error.
 */
export async function withDbErrorHandling<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (err: unknown) {
    logger.error({ err });
    const error = err as { code?: string; errno?: number };
    if (error.code?.startsWith?.("ER_") || typeof error.errno === "number") {
      handleMySqlError(error);
    }
    throw error;
  }
}
