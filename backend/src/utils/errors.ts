// ENHANCED ERROR HANDLING
// src/utils/errors.ts
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Resource Management
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",

  // Database
  DATABASE_ERROR = "DATABASE_ERROR",
  FOREIGN_KEY_CONSTRAINT = "FOREIGN_KEY_CONSTRAINT",

  // System
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: any;
  public readonly originalError?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with id ${identifier} does not exist.`
      : `${resource} not found`;
    super(message, 404, ErrorCode.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, ErrorCode.CONFLICT, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string = "Database operation failed",
    originalError?: any,
  ) {
    super(message, 500, ErrorCode.DATABASE_ERROR, true, originalError);
  }
}

// Error handler middleware interface

export const createErrorResponse = (
  error: AppError,
  includeStack: boolean = false,
) => {
  return {
    success: false,
    message: error.message,
    errorCode: error.errorCode,
    details: error.originalError ? error.originalError.message : undefined,
    stack: includeStack ? error.stack : undefined,
  };
};
