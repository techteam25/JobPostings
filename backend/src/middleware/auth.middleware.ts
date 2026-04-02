import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { ApiResponse } from "@shared/types";
import logger from "@shared/logger";
import { auth } from "@/utils/auth";

/**
 * Middleware class for handling authentication.
 * Authorization guards have been moved to their owning modules
 * (see src/modules/{module}/guards/).
 */
export class AuthMiddleware {
  /**
   * Authenticates the user by checking the session and attaching user info to the request.
   * @param req The Express request object.
   * @param res The Express response object.
   * @param next The next middleware function.
   */
  /**
   * Sets req.userId if a valid session exists, but allows the request
   * through regardless. Use on public routes that enrich responses
   * for authenticated users (e.g. hasSaved on job listings).
   */
  optionalAuthenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (session && session.user.status === "active") {
        req.user = {
          ...session.user,
          fullName: session.user.name,
          id: parseInt(session.user.id),
          image: session.user.image as string | null,
          deletedAt: session.user.deletedAt as Date | null,
          lastLoginAt: session.user.lastLoginAt as Date | null,
          intent: session.user.intent as "seeker" | "employer",
          onboardingStatus: session.user.onboardingStatus as
            | "pending"
            | "completed",
        };
        req.userId = parseInt(session.user.id);
      }
    } catch {
      // Silently continue without auth
    }

    return next();
  };

  authenticate = async (
    req: Request,
    res: Response<ApiResponse<void>>,
    next: NextFunction,
  ) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          status: "error",
          message: "Authentication required",
          error: "UNAUTHORIZED",
          timestamp: new Date().toISOString(),
        });
      }

      if (session.user.status !== "active") {
        return res.status(403).json({
          success: false,
          status: "error",
          message: "User account is deactivated",
          error: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        });
      }

      // Attach user info to request object
      req.user = {
        ...session.user,
        fullName: session.user.name,
        id: parseInt(session.user.id),
        image: session.user.image as string | null,
        deletedAt: session.user.deletedAt as Date | null,
        lastLoginAt: session.user.lastLoginAt as Date | null,
        intent: session.user.intent as "seeker" | "employer",
        onboardingStatus: session.user.onboardingStatus as
          | "pending"
          | "completed",
      };
      req.userId = parseInt(session.user.id);

      return next();
    } catch (error) {
      logger.error(error);
      return res.status(401).json({
        success: false,
        status: "error",
        message: "Invalid token",
        error: "UNAUTHORIZED",
        timestamp: new Date().toISOString(),
      });
    }
  };
}
