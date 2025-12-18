import logger from "@/logger";
import { AppError, DatabaseError } from "@/utils/errors";

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
  ER_NO_SUCH_INDEX: "Index not found",

  // Query & syntax
  ER_PARSE_ERROR: "SQL syntax error",
  ER_BAD_FIELD_ERROR: "Unknown column in query",
  ER_NO_SUCH_TABLE: "Table not found",
  ER_TABLE_EXISTS_ERROR: "Table already exists",
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: "Invalid value for column",
  ER_WARN_DATA_TRUNCATED: "Data truncated for column",
  ER_KEY_NOT_FOUND: "Record not found in table",
  ER_UNKNOWN_COM_ERROR: "Unknown command error",

  // Connection & access
  ER_ACCESS_DENIED_ERROR: "Invalid database credentials",
  ER_NO_DB_ERROR: "No database selected",
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
 * This function takes a MySQL error object, extracts the error code, and maps it to a user-friendly message
 * using the MYSQL_ERROR_MAP. If the error is already an AppError, it re-throws it. Otherwise, it creates
 * a new DatabaseError with the friendly message and logs the error details.
 * @param err The MySQL error object containing code, errno, and message properties.
 * @throws Always throws a DatabaseError or re-throws the original AppError.
 */
export function handleMySqlError(err: any): never {
  // Try both symbolic code and numeric errno
  const code = err?.code || `ER_${err?.errno}`;
  const friendlyMessage =
    MYSQL_ERROR_MAP[code as keyof typeof MYSQL_ERROR_MAP] ||
    (err?.message as string) ||
    "Unknown database error";

  logger.error({ friendlyMessage, err });

  if (err instanceof AppError) {
    throw err;
  }

  throw new DatabaseError(friendlyMessage);
}

/**
 * Wrapper helper: runs an async DB operation and translates any MySQL error.
 * This function wraps database operations to catch MySQL-specific errors and convert them into
 * user-friendly DatabaseError instances. It checks if the error is a MySQL error by looking for
 * error codes starting with 'ER_' or numeric errno. Non-MySQL errors are logged and wrapped in
 * a generic DatabaseError. AppError instances are re-thrown as-is.
 * @param operation A function that performs the database operation and returns a Promise<T>.
 * @returns The result of the database operation if successful.
 * @throws DatabaseError if a MySQL error occurs, or AppError if it was already an AppError.
 */
export async function withDbErrorHandling<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (err: unknown) {
    const error = err as { code?: string; errno?: number };
    if (error.code?.startsWith?.("ER_") || typeof error.errno === "number") {
      handleMySqlError(error);
    }

    logger.error({ err });
    if (err instanceof AppError) {
      throw err;
    }
    throw new DatabaseError("Internal Server Error");
  }
}
