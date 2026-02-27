// controllers/base.controller.ts
import { Response } from "express";
import { AppError, ErrorCode } from "@/utils/errors";
import logger from "@/logger";
import { PaginationMeta } from "@/types";

/**
 * Base controller class providing common response handling methods for API controllers.
 */
export class BaseController {
  private readonly includeStack = process.env.NODE_ENV === "development";

  /**
   * Sends a successful response with data.
   * @param res The Express response object.
   * @param data The data to send in the response.
   * @param message The success message.
   * @param statusCode The HTTP status code.
   * @returns The Express response object.
   */
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

  /**
   * Sends a paginated response with data and pagination metadata.
   * @param res The Express response object.
   * @param data The array of data to send.
   * @param pagination The pagination metadata.
   * @param message The success message.
   * @param statusCode The HTTP status code.
   * @returns The Express response object.
   */
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

  /**
   * Sends an error response based on the AppError instance.
   * @param res The Express response object.
   * @param error The AppError instance.
   * @returns The Express response object.
   */
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

  /**
   * Handles errors in controllers by logging and sending appropriate responses.
   * @param res The Express response object.
   * @param error The unknown error.
   * @param defaultMessage The default error message.
   * @param defaultStatusCode The default HTTP status code.
   * @returns The Express response object.
   */
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

  /**
   * Classifies unknown errors into AppError or subclasses.
   * @param error The unknown error.
   * @param defaultMessage The default error message.
   * @param defaultStatusCode The default HTTP status code.
   * @returns The classified AppError instance.
   */
  private classifyError(
    error: unknown,
    defaultMessage: string,
    defaultStatusCode: number,
  ): AppError {
    // All error subclasses (NotFoundError, UnauthorizedError, etc.) extend AppError
    if (error instanceof AppError) return error;

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
