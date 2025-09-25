import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ValidationError } from "../utils/errors";

// Extend Request interface to include sanitized properties
interface SanitizedRequest extends Request {
  sanitizedBody?: any;
  sanitizedQuery?: any;
  sanitizedParams?: any;
}

interface ValidationSchemas {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
}

export const validateRequest = (
  schemas: ValidationSchemas | z.ZodSchema<any>
) => {
  return (req: SanitizedRequest, res: Response, next: NextFunction) => {
    try {
      console.log("validateRequest input:", {
        sanitizedBody: req.sanitizedBody,
        body: req.body,
      });

      // Handle single schema
      if ("_def" in schemas) {
        const bodySchema = schemas as z.ZodSchema<any>;
        const dataToValidate = req.sanitizedBody ?? req.body;
        console.log("Validating single schema with:", dataToValidate);
        req.sanitizedBody = bodySchema.parse(dataToValidate);
        return next();
      }

      // Handle multiple schemas
      const { body, query, params } = schemas as ValidationSchemas;
      const errors: { field: string; message: string; code: string }[] = [];

      if (body) {
        try {
          const dataToValidate = req.sanitizedBody ?? req.body;
          console.log("Validating body schema with:", dataToValidate);
          req.sanitizedBody = body.parse(dataToValidate);
        } catch (e) {
          if (e instanceof ZodError) {
            errors.push(
              ...e.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              }))
            );
          }
        }
      }

      if (query) {
        try {
          const dataToValidate = req.sanitizedQuery ?? req.query;
          req.sanitizedQuery = query.parse(dataToValidate);
        } catch (e) {
          if (e instanceof ZodError) {
            errors.push(
              ...e.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              }))
            );
          }
        }
      }

      if (params) {
        try {
          const dataToValidate = req.sanitizedParams ?? req.params;
          req.sanitizedParams = params.parse(dataToValidate);
        } catch (e) {
          if (e instanceof ZodError) {
            errors.push(
              ...e.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              }))
            );
          }
        }
      }

      if (errors.length > 0) {
        console.log("Validation errors:", errors);
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors,
          timestamp: new Date().toISOString(),
        });
      }

      console.log("After validation:", { sanitizedBody: req.sanitizedBody });
      next();
    } catch (error) {
      console.error("Validation error:", error);
      if (error instanceof ValidationError) {
        return res.status(400).json({
          status: "error",
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        status: "error",
        message: "Internal validation error",
        timestamp: new Date().toISOString(),
      });
    }
  };
};

export const validateBody = (schema: z.ZodSchema<any>) =>
  validateRequest({ body: schema });
export const validateQuery = (schema: z.ZodSchema<any>) =>
  validateRequest({ query: schema });
export const validateParams = (schema: z.ZodSchema<any>) =>
  validateRequest({ params: schema });

export const sanitizeInput = (
  req: SanitizedRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("Before sanitization:", {
    body: req.body,
    query: req.query,
    params: req.params,
  });
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Store sanitized data in custom properties
  req.sanitizedBody = sanitize(req.body);
  req.sanitizedQuery = sanitize(req.query);
  req.sanitizedParams = sanitize(req.params);

  console.log("After sanitization:", {
    sanitizedBody: req.sanitizedBody,
    sanitizedQuery: req.sanitizedQuery,
    sanitizedParams: req.sanitizedParams,
  });
  next();
};