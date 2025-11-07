import { Request, Response } from "express";
import {
  AppError,
  ErrorCode,
  UnauthorizedError,
  DatabaseError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "@/utils/errors";
import logger from "@/logger";
import { PaginationMeta } from "@/types";
import { PaginationParams, SearchParams } from "@/validations/base.validation";

export class BaseController {
  private readonly includeStack = process.env.NODE_ENV === "development";

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

  protected sendError(res: Response, error: AppError): Response {
    const response = {
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      details: error.details,
      ...(this.includeStack && { stack: error.stack }),
    };

    return res.status(error.statusCode).json(response);
  }

  protected extractPaginationParam (
    req: Request<{}, {}, {}, Pick<SearchParams["query"], "limit" | "page">>,
  ) {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 10)));

    return { page, limit };
  }

  protected handleControllerError(
    res: Response,
    error: unknown,
    defaultMessage = "Operation failed",
    defaultStatusCode = 500,
  ): Response {
    logger.error(error, "Controller Error");

    const appError = this.classifyError(
      error,
      defaultMessage,
      defaultStatusCode,
    );
    return this.sendError(res, appError);
  }

  /** Classifies unknown errors into AppError or subclasses */
  private classifyError(
    error: unknown,
    defaultMessage: string,
    defaultStatusCode: number,
  ): AppError {
    // Already a known AppError
    if (error instanceof AppError) return error;

    // UnauthorizedError
    if (error instanceof UnauthorizedError) return error;

    // ForbiddenError
    if (error instanceof ForbiddenError) return error;

    // NotFoundError
    if (error instanceof NotFoundError) return error;

    // ConflictError
    if (error instanceof ConflictError) return error;

    // DatabaseError
    if (error instanceof DatabaseError) return error;

    // Catch-all fallback
    return new AppError(
      defaultMessage,
      defaultStatusCode,
      ErrorCode.INTERNAL_ERROR,
      true,
      error,
    );
  }
}
