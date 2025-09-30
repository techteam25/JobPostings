import { Request, Response, NextFunction } from "express";
import {
  AppError,
  createErrorResponse,
  ValidationError,
} from "../utils/errors";
import { env } from "../config/env";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Handle known AppError instances
  if (err instanceof AppError) {
    const errorResponse = createErrorResponse(
      err,
      env.NODE_ENV === "development",
    );

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle validation errors from libraries
  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: "error",
      message: err.message || "Validation failed",
      errorCode: "VALIDATION_ERROR",
      timestamp: new Date().toISOString(),
    });
  }

  // Handle JWT errors
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
      errorCode: "INVALID_TOKEN",
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      status: "error",
      message: "Token expired",
      errorCode: "TOKEN_EXPIRED",
      timestamp: new Date().toISOString(),
    });
  }

  // Handle database errors
  if (err.message.includes("duplicate") || err.message.includes("unique")) {
    return res.status(409).json({
      status: "error",
      message: "Resource already exists",
      errorCode: "ALREADY_EXISTS",
      timestamp: new Date().toISOString(),
    });
  }

  if (err.message.includes("foreign key constraint")) {
    return res.status(400).json({
      status: "error",
      message: "Cannot complete operation due to related records",
      errorCode: "FOREIGN_KEY_CONSTRAINT",
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Multer file upload errors
  // if (err instanceof MulterError) {
  //   let message = "File upload error";
  //   let statusCode = 400;
  //
  //   switch ((err as any).code) {
  //     case "LIMIT_FILE_SIZE":
  //       message = "File size too large";
  //       break;
  //     case "LIMIT_UNEXPECTED_FILE":
  //       message = "Unexpected file field";
  //       break;
  //     case "LIMIT_FILE_COUNT":
  //       message = "Too many files uploaded";
  //       break;
  //   }
  //
  //   return res.status(statusCode).json({
  //     status: "error",
  //     message,
  //     errorCode: "FILE_UPLOAD_ERROR",
  //     timestamp: new Date().toISOString(),
  //   });
  // }

  // Handle rate limiting errors
  if (
    err.message.includes("rate limit") ||
    err.message.includes("too many requests")
  ) {
    return res.status(429).json({
      status: "error",
      message: "Too many requests, please try again later",
      errorCode: "RATE_LIMIT_EXCEEDED",
      timestamp: new Date().toISOString(),
    });
  }

  // Default error response for unknown errors
  const statusCode = 500;
  const message =
    env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "An unexpected error occurred";

  return res.status(statusCode).json({
    status: "error",
    message,
    errorCode: "INTERNAL_ERROR",
    timestamp: new Date().toISOString(),
    ...(env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
    errorCode: "NOT_FOUND",
    timestamp: new Date().toISOString(),
  });
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
