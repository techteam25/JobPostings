import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

/**
 * Validation error response structure
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Standardized error response
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: ValidationError[];
  };
}

/**
 * Formats Zod validation errors into a standardized structure
 */
const formatZodErrors = (error: ZodError): ValidationError[] => {
  return error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
};

/**
 * Validates incoming request data against a Zod schema
 *
 * @param schema - Zod schema that defines the expected structure for body, query, and params
 * @returns Express middleware function
 */
const validate =
  (schema: ZodObject<any, any>) =>
  (
    req: Request<unknown, unknown, unknown, unknown>,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      // Explicitly construct the validation object with all required properties
      const validationData = {
        body: req.body ?? {},
        query: req.query ?? {},
        params: req.params ?? {},
      };

      // Parse and validate the request data
      const parsed = schema.parse(validationData);

      // Attach validated data back to request (type-safe and sanitized)
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: formatZodErrors(error),
          },
        };

        res.status(400).json(errorResponse);
        return;
      }

      // Handle unexpected errors
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred during validation",
          details: [],
        },
      };

      res.status(500).json(errorResponse);
    }
  };

export default validate;
