// src/shared/result/index.ts
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
