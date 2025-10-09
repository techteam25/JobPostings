import { AppError, DatabaseError, ValidationError } from "@/utils/errors";

export abstract class BaseService {
  protected handleError(error: any): never {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error) {
      // Handle specific database errors
      if (error.message.includes("Duplicate entry")) {
        throw new ValidationError(
          "A record with this information already exists",
        );
      }

      if (error.message.includes("foreign key constraint")) {
        throw new ValidationError(
          "Cannot complete operation due to related records",
        );
      }

      // Handle other known error types
      if (
        error.message.includes("validation") ||
        error.message.includes("invalid")
      ) {
        throw new ValidationError(error.message);
      }

      // Database connection errors
      if (
        error.message.includes("connect") ||
        error.message.includes("timeout")
      ) {
        throw new DatabaseError("Database connection error");
      }

      throw new AppError(error.message, 500);
    }

    // Handle unknown errors
    throw new AppError("An unexpected error occurred", 500);
  }
}
