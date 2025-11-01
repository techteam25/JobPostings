import { AppError, DatabaseError, ValidationError } from "@/utils/errors";

export abstract class BaseService {
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
export type Result<T, E> = Success<T> | Failure<E>;

export class Success<T> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;

  constructor(public readonly value: T) {}
}

export class Failure<E> {
  readonly isSuccess = false as const;
  readonly isFailure = true as const;

  constructor(public readonly error: E) {}
}

// Helper functions
export const ok = <T>(value: T): Success<T> => new Success(value);
export const fail = <E>(error: E): Failure<E> => new Failure(error);
