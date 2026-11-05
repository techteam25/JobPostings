/**
 * Type guard for errors thrown by the Typesense JS client. Those errors
 * carry an `httpStatus` field that indicates the underlying HTTP status
 * (e.g. 404 for `ObjectNotFound`). Narrowing on this shape lets callers
 * treat specific statuses as idempotent no-ops instead of bubbling them up.
 */
export interface TypesenseHttpError {
  httpStatus: number;
}

export function isTypesenseHttpError(
  error: unknown,
): error is TypesenseHttpError {
  return (
    typeof error === "object" &&
    error !== null &&
    "httpStatus" in error &&
    typeof (error as { httpStatus: unknown }).httpStatus === "number"
  );
}
