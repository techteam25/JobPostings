import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { ApiResponse } from "@/types";
import { UserService } from "@/services/user.service";

import logger from "@/logger";
import { auth } from "@/utils/auth";
import { OrganizationService } from "@/services/organization.service";
import { GetOrganizationSchema } from "@/validations/organization.validation";
import { GetUserSchema } from "@/validations/user.validation";
import { JobRepository } from "@/repositories/job.repository";
import { GetJobApplicationSchema } from "@/validations/jobApplications.validation";

export class AuthMiddleware {
  private readonly organizationService: OrganizationService;
  private readonly userService: UserService;
  private readonly jobRepository: JobRepository;

  constructor() {
    this.organizationService = new OrganizationService();
    this.userService = new UserService();
    this.jobRepository = new JobRepository();
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
            success: false,
            status: "error",
            error: "UNAUTHORIZED",
            message: "Authentication required",
          });
        }

        // Fetch user to check role
        const isPermitted = await this.organizationService.isRolePermitted(
          req.userId,
        );

        if (!isPermitted.isSuccess || !isPermitted.value) {
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        const organizationMember =
          await this.organizationService.getOrganizationMember(req.userId);

        if (!organizationMember.isSuccess) {
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        req.organizationId = organizationMember.value.organizationId;

        return next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "Error checking user permissions",
        });
      }
    };
  };

  requireAdminOrOwnerRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userId) {
          return res.status(401).json({
            success: false,
            status: "error",
            error: "UNAUTHORIZED",
            message: "Authentication required",
          });
        }

        if (!["owner", "admin"].some((role) => roles.includes(role))) {
          return res.status(400).json({
            success: false,
            status: "error",
            error: "BAD_REQUEST",
            message:
              "Invalid roles configuration. This middleware should only include 'owner' or 'admin'",
          });
        }

        const user = await this.organizationService.getOrganizationMember(
          req.userId,
        );

        if (!user.isSuccess) {
          // User may be authenticated but not an organization member
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        if (!roles.includes(user.value.role)) {
          // Check if user's role is in the permitted roles
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        // Fetch user to check role
        const isPermitted = await this.userService.hasPrerequisiteRoles(
          req.userId,
          ["owner", "admin"],
        );

        if (!isPermitted) {
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        return next();
      } catch (error) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }
    };
  };

  // This will check for 'user' role (i.e., not pure employer)
  requireUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      // Fetch user to check role
      const userService = new UserService();
      const userCanSeekJobs = await userService.canSeekJobs(req.userId);

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
      if (!userCanSeekJobs) {
        //
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        error: "INTERNAL_SERVER_ERROR",
        message: "Error checking user permissions",
      });
    }
  };
  requireActiveUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user || req.user.status !== "active") {
      return res.status(401).json({
        success: false,
        status: "error",
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }
    return next();
  };

  ensureIsOrganizationMember = async (
    req: Request<GetOrganizationSchema["params"]>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.userId || !req.params.organizationId) {
        return res.status(401).json({
          success: false,
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      const organizationMember =
        await this.organizationService.getOrganizationMember(req.userId);

      if (
        !organizationMember.isSuccess ||
        organizationMember.value.organizationId !==
          Number(req.params.organizationId)
      ) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        error: "INTERNAL_SERVER_ERROR",
        message: "Error checking user permissions",
      });
    }
  };

  requireOwnAccount = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.userId || !req.params.id) {
        return res.status(401).json({
          success: false,
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      if (req.userId !== Number(req.params.id)) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "You can only access your own account",
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        error: "INTERNAL_SERVER_ERROR",
        message: "Error checking user permissions",
      });
    }
  };

  ensureApplicationOwnership = async (
    req: Request<GetJobApplicationSchema["params"]>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      const applicationId = Number(req.params.applicationId);

      const application =
        await this.jobRepository.findApplicationById(applicationId);

      if (!application) {
        return res.status(404).json({
          success: false,
          status: "error",
          error: "NOT_FOUND",
          message: "Application not found",
        });
      }

      if (application.application.applicantId !== req.userId) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "You can only withdraw your own applications",
        });
      }

      return next();
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        status: "error",
        error: "INTERNAL_SERVER_ERROR",
        message: "Error checking application ownership",
      });
    }
  };
}
