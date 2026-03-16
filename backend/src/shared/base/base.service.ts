import { AppError, DatabaseError, ValidationError } from "@shared/errors";
import { fail } from "@shared/result";

/**
 * Abstract base service class providing common error handling functionality.
 */
export abstract class BaseService {
  /**
   * Handles errors by categorizing them into specific types and returning a Failure result.
   * @param error The error to handle.
   * @returns A Failure containing the appropriate error type.
   */
  protected handleError(error: Error) {
    if (error instanceof AppError) {
      return fail(error);
    }

    // Handle specific database errors
    if (error.message.includes("Duplicate entry")) {
      return fail(
        new ValidationError("A record with this information already exists"),
      );
    }
    if (error.message.includes("foreign key constraint")) {
      return fail(
        new ValidationError("Cannot complete operation due to related records"),
      );
    }
    if (
      error.message.includes("validation") ||
      error.message.includes("invalid")
    ) {
      return fail(new ValidationError(error.message));
    }
    if (
      error.message.includes("connect") ||
      error.message.includes("timeout")
    ) {
      return fail(new DatabaseError("Database connection error"));
    }

    // Handle unknown errors
    return fail(new AppError("An unexpected error occurred", 500));
  }
}
