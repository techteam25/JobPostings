import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { ApiResponse } from "@/types";
import { UserService } from "@/services/user.service";

import logger from "@/logger";
import { auth } from "@/utils/auth";
import { OrganizationService } from "@/services/organization.service";

export class AuthMiddleware {
  private readonly organizationService: OrganizationService;

  constructor() {
    this.organizationService = new OrganizationService();
  }

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

  requireJobPostingRole = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userId) {
          return res.status(401).json({
            status: "error",
            message: "Authentication required",
          });
        }

        // Fetch user to check role
        const isPermitted = await this.organizationService.isRolePermitted(
          req.userId,
        );

        if (!isPermitted) {
          return res.status(403).json({
            status: "error",
            message: "Insufficient permissions",
          });
        }

        return next();
      } catch (error) {
        return res.status(500).json({
          status: "error",
          message: "Error checking user permissions",
        });
      }
    };
  };

  // This will check for 'user' role (i.e., not pure employer)
  requireUserRole = () => {
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

        /*
        Scenario 1: Pure Job Seeker
        Has a record in users ✓
        Has a record in userProfile ✓
        No records in organizationMembers ✗

        Scenario 2: Pure Employer
        Has a record in users ✓
        No record in userProfile ✗
        Has record(s) in organizationMembers ✓

        Scenario 3: Hybrid User (Freelancer/Consultant)
        Has a record in users ✓
        Has a record in userProfile ✓
        Has record(s) in organizationMembers ✓
         */
        if (user && !user.profile) {
          //
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
    if (!req.user || req.user.status !== "active") {
      return res.status(403).json({
        status: "error",
        message: "User account is not active",
      });
    }
    return next();
  };
}
