// controllers/base.controller.ts
import { Request, Response } from "express";
import { AppError, ErrorCode, createErrorResponse } from "../utils/errors";

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface PaginatedResponse<T = any> {
  success: true;
  message: string;
  data: T[];
  pagination: PaginationMeta;
  timestamp?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SearchParams {
  search?: string;
}

export class BaseController {
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message: string = "Operation successful",
    statusCode: number = 200,
  ): Response {
    const response: SuccessResponse<T> = {
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
    const response: PaginatedResponse<T> = {
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

  protected extractPaginationParams(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      1,
      Math.max(100, parseInt(req.query.limit as string) || 10),
    );

    return { page, limit };
  }

  protected extractSearchParams(req: Request): SearchParams {
    return {
      search: (req.query.search as string) || undefined,
    };
  }

  protected handleControllerError(
    res: Response,
    error: any,
    defaultMessage: string = "Operation failed",
    defaultStatusCode: number = 500,
  ): Response {
    console.error("Controller Error:", error);

    if (error instanceof AppError) {
      return this.sendError(res, error, process.env.NODE_ENV === "development");
    }

    // Handle validation errors from external libraries
    if (error.name === "ValidationError" || error.name === "ZodError") {
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
      error.code &&
      (error.code.includes("ER_") || error.code.includes("SQLITE_"))
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

  protected validateId(id: string, resourceName: string = "Resource"): number {
    const numericId = parseInt(id);
    if (isNaN(numericId) || numericId <= 0) {
      throw new AppError(
        `Invalid ${resourceName.toLowerCase()} ID`,
        400,
        ErrorCode.VALIDATION_ERROR,
      );
    }
    return numericId;
  }

  protected validateRequiredFields(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(
      (field) =>
        data[field] === undefined || data[field] === null || data[field] === "",
    );

    if (missingFields.length > 0) {
      throw new AppError(
        `Missing required fields: ${missingFields.join(", ")}`,
        400,
        ErrorCode.VALIDATION_ERROR,
      );
    }
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
