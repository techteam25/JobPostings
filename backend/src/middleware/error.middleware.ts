import { Request, Response, NextFunction } from "express";
import { AppError, createErrorResponse, ValidationError } from "@shared/errors";
import { env } from "@shared/config/env";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

/**
 * Express error handling middleware that processes various types of errors and sends appropriate responses.
 * @param err The error object, which can be a standard Error or an AppError.
 * @param _ The Express request object (unused in this middleware).
 * @param res The Express response object used to send the error response.
 * @param __ The next middleware function (unused in this middleware).
 */
export const errorHandler = (
  err: Error | AppError,
  _: Request,
  res: Response,
  __: NextFunction,
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
