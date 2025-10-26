// controllers/base.controller.ts
import { Request, Response } from "express";
import {
  AppError,
  ErrorCode,
  createErrorResponse,
  ValidationError,
  UnauthorizedError,
} from "@/utils/errors";
import logger from "@/logger";
import { PaginationMeta } from "@/types";

export class BaseController {
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message: string = "Operation successful",
    statusCode: number = 200,
  ): Response {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  protected sendPaginatedResponse<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message: string = "Data retrieved successfully",
    statusCode: number = 200,
  ): Response {
    const response = {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  protected sendError(
    res: Response,
    error: AppError,
    includeStack: boolean = false,
  ): Response {
    const response = createErrorResponse(error, includeStack);
    return res.status(error.statusCode).json(response);
  }

  protected extractPaginationParams(req: Request<any, any, any, any>) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));

    return { page, limit };
  }

  protected handleControllerError(
    res: Response,
    error: unknown,
    defaultMessage: string = "Operation failed",
    defaultStatusCode: number = 500,
  ): Response {
    logger.error(error, "Controller Error:");

    if (error instanceof AppError) {
      return this.sendError(res, error, process.env.NODE_ENV === "development");
    }

    if (error instanceof UnauthorizedError) {
      return this.sendError(res, error, process.env.NODE_ENV === "development");
    }

    // Handle validation errors from external libraries
    if (error instanceof ValidationError) {
      const validationError = new AppError(
        error.message || "Validation failed",
        400,
        ErrorCode.VALIDATION_ERROR,
        true,
        error,
      );
      return this.sendError(
        res,
        validationError,
        process.env.NODE_ENV === "development",
      );
    }

    // Handle database errors
    if (
      error instanceof Error &&
      "code" in error &&
      typeof error.code === "string" &&
      error.code.startsWith("ER_")
    ) {
      const dbError = new AppError(
        "Database operation failed",
        500,
        ErrorCode.DATABASE_ERROR,
        true,
        error,
      );
      return this.sendError(
        res,
        dbError,
        process.env.NODE_ENV === "development",
      );
    }

    // Default error handling
    const genericError = new AppError(
      defaultMessage,
      defaultStatusCode,
      ErrorCode.INTERNAL_ERROR,
      true,
      error,
    );

    return this.sendError(
      res,
      genericError,
      process.env.NODE_ENV === "development",
    );
  }

  protected sanitizeOutput(
    data: any,
    fieldsToRemove: string[] = ["passwordHash", "password"],
  ): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeOutput(item, fieldsToRemove));
    }

    if (data && typeof data === "object") {
      const sanitized = { ...data };
      fieldsToRemove.forEach((field) => {
        delete sanitized[field];
      });
      return sanitized;
    }

    return data;
  }
}