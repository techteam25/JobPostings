import { AppError, DatabaseError, ValidationError } from "@/utils/errors";

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

// src/core/result.ts
/**
 * Represents a result that can be either a success or a failure.
 */
export type Result<T, E> = Success<T> | Failure<E>;

/**
 * Represents a successful result containing a value.
 */
export class Success<T> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;

  /**
   * Creates a new Success instance.
   * @param value The value of the success.
   */
  constructor(public readonly value: T) {}
}

/**
 * Represents a failed result containing an error.
 */
export class Failure<E> {
  readonly isSuccess = false as const;
  readonly isFailure = true as const;

  /**
   * Creates a new Failure instance.
   * @param error The error of the failure.
   */
  constructor(public readonly error: E) {}
}

// Helper functions
/**
 * Creates a Success result with the given value.
 * @param value The value to wrap in a Success.
 * @returns A Success instance.
 */
export const ok = <T>(value: T): Success<T> => new Success(value);

/**
 * Creates a Failure result with the given error.
 * @param error The error to wrap in a Failure.
 * @returns A Failure instance.
 */
export const fail = <E>(error: E): Failure<E> => new Failure(error);
