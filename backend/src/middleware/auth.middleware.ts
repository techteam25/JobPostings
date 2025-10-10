import type { NextFunction, Request, Response } from "express";
import { UserService } from "@/services/user.service";
import logger from "@/logger";
import { SecurityUtils } from "@/utils/security";
import { ApiResponse } from "@/types";

export class AuthMiddleware {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  authenticate = async (
    req: Request,
    res: Response<ApiResponse<void>>,
    next: NextFunction,
  ) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.header(
          "WWW-Authenticate",
          `Bearer realm=${req.originalUrl} charset="UTF-8"`,
        );

        return res.status(401).json({
          success: false,
          status: "error",
          message: "Authentication required",
          error: "UNAUTHORIZED",
          timestamp: new Date().toISOString(),
        });
      }

      const token = authHeader.substring(7);
      const decoded = SecurityUtils.verifyAccessToken(token);

      req.user = await this.userService.getUserById(decoded.userId);
      req.userId = decoded.userId;

      return next();
    } catch (error) {
      logger.error(error);
      return res.status(401).json({
        success: false,
        status: "error",
        message: "Invalid or expired token",
        error: "UNAUTHORIZED",
        timestamp: new Date().toISOString(),
      });
    }
  };

  requireRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userId) {
          return res.status(401).json({
            status: "error",
            message: "Authentication required",
          });
        }

        // Fetch user to check role
        const userService = new UserService();
        const user = await userService.getUserById(req.userId);

        if (!roles.includes(user.role)) {
          return res.status(403).json({
            status: "error",
            message: "Insufficient permissions",
          });
        }

        req.user = user;
        return next();
      } catch (error) {
        return res.status(500).json({
          status: "error",
          message: "Error checking user permissions",
        });
      }
    };
  };

  requireActiveUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user || !req.user.isActive) {
      return res.status(403).json({
        status: "error",
        message: "User account is not active",
      });
    }
    return next();
  };
}
