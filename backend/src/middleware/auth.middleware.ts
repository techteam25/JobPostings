import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { ApiResponse } from "@/types";
import { UserService } from "@/services/user.service";
import { AuditService } from "@/services/audit.service";

import logger from "@/logger";
import { auth } from "@/utils/auth";
import { OrganizationService } from "@/services/organization.service";
import { GetOrganizationSchema } from "@/validations/organization.validation";
import { GetUserSchema } from "@/validations/user.validation";
import { JobRepository } from "@/repositories/job.repository";
import { GetJobApplicationSchema } from "@/validations/jobApplications.validation";
import { GetJobSchema } from "@/validations/job.validation";
import { NotFoundError } from "@/utils/errors";
import { JobService } from "@/services/job.service";

/**
 * Middleware class for handling authentication and authorization in the application.
 */
export class AuthMiddleware {
  private readonly organizationService: OrganizationService;
  private readonly userService: UserService;
  private readonly jobRepository: JobRepository;
  private readonly jobService: JobService;
  private readonly auditService: AuditService;

  /**
   * Creates an instance of AuthMiddleware and initializes the required services.
   */
  constructor() {
    this.organizationService = new OrganizationService();
    this.userService = new UserService();
    this.jobRepository = new JobRepository();
    this.jobService = new JobService();
    this.auditService = new AuditService();
  }

  /**
   * Helper method to extract IP address from request
   */
  private getIpAddress(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip ||
      "unknown"
    );
  }

  /**
   * Authenticates the user by checking the session and attaching user info to the request.
   * @param req The Express request object.
   * @param res The Express response object.
   * @param next The next middleware function.
   */
  authenticate = async (
    req: Request,
    res: Response<ApiResponse<void>>,
    next: NextFunction,
  ) => {
    const ipAddress = this.getIpAddress(req);
    const userAgent = req.headers["user-agent"];

    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
         // Log failed authentication attempt - no session
        await this.auditService.logAuthEvent({
          userEmail: "unknown",
          action: "auth.login",
          ipAddress,
          userAgent,
          success: "false",
          errorMessage: "No valid session found",
        }).catch((err) => logger.error("Failed to log auth event:", err)); 

        return res.status(401).json({
          success: false,
          status: "error",
          message: "Authentication required",
          error: "UNAUTHORIZED",
          timestamp: new Date().toISOString(),
        });
      }

      if (session.user.status !== "active") {
        // Log failed authentication - deactivated account
        await this.auditService.logAuthEvent({
          userId: parseInt(session.user.id),
          userEmail: session.user.email,
          action: "auth.login",
          ipAddress,
          userAgent,
          success: "false",
          errorMessage: "User account is deactivated",
        }).catch((err) => logger.error("Failed to log auth event:", err));

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

      // Log successful authentication (only once per session to avoid spam)
      await this.auditService.log({
        userId: req.userId,
        userEmail: session.user.email,
        action: "auth.login",
        severity: "info",
        ipAddress,
        userAgent,
        sessionId: req.headers["authorization"]?.split(" ")[1],
        success: "true",
        description: "User authenticated successfully",
        metadata: {
          method: req.method,
          path: req.path,
        },
      }).catch((err) => logger.error("Failed to log auth event:", err));

      return next();
    } catch (error) {
      logger.error(error);

      // Log authentication error
      await this.auditService.log({
        action: "auth.login",
        severity: "error",
        ipAddress,
        userAgent,
        success: "false",
        errorMessage: error instanceof Error ? error.message : "Authentication error",
        errorStack: error instanceof Error ? error.stack : undefined,
        description: "Authentication failed due to error",
      }).catch((err) => logger.error("Failed to log auth event:", err));

      return res.status(401).json({
        success: false,
        status: "error",
        message: "Invalid token",
        error: "UNAUTHORIZED",
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Middleware to require job posting role for the user.
   *  * Logs authorization failures.
   * @returns A middleware function that checks if the user has permission to post jobs.
   */
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
          // Log authorization failure
          await this.auditService.log({
            userId: req.userId,
            userEmail: req.user?.email,
            action: "job.create",
            severity: "warning",
            ipAddress: this.getIpAddress(req),
            userAgent: req.headers["user-agent"],
            success: "false",
            errorMessage: "Insufficient permissions - no job posting role",
            description: "User attempted to post job without proper permissions",
          }).catch((err) => logger.error("Failed to log auth event:", err));

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
          // Log authorization failure
          await this.auditService.log({
            userId: req.userId,
            userEmail: req.user?.email,
            action: "job.create",
            severity: "warning",
            ipAddress: this.getIpAddress(req),
            userAgent: req.headers["user-agent"],
            success: "false",
            errorMessage: "User is not an organization member",
            description: "User attempted to post job without organization membership",
          }).catch((err) => logger.error("Failed to log auth event:", err));

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
        logger.error(error);

        // Log error
        await this.auditService.log({
          userId: req.userId,
          userEmail: req.user?.email,
          action: "job.create",
          severity: "error",
          ipAddress: this.getIpAddress(req),
          userAgent: req.headers["user-agent"],
          success: "false",
          errorMessage: error instanceof Error ? error.message : "Permission check error",
          description: "Error while checking job posting permissions",
        }).catch((err) => logger.error("Failed to log auth event:", err));

        return res.status(500).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "Error checking user permissions",
        });
      }
    };
  };

  /**
   * Middleware to require admin or owner role for the user.
   * Logs authorization failures.
   * @param roles The roles to check for (owner or admin).
   * @returns A middleware function that checks if the user has the required role.
   */
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
          // Log authorization failure - not an organization member
          await this.auditService.log({
            userId: req.userId,
            userEmail: req.user?.email,
            action: "admin.logs_view",
            severity: "warning",
            ipAddress: this.getIpAddress(req),
            userAgent: req.headers["user-agent"],
            success: "false",
            errorMessage: "User is not an organization member",
            description: "User attempted admin action without organization membership",
            metadata: {
              requiredRoles: roles,
              path: req.path,
            },
          }).catch((err) => logger.error("Failed to log auth event:", err));

          // User may be authenticated but not an organization member
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        if (!roles.includes(user.value.role)) {
            // Log authorization failure - wrong role
          await this.auditService.log({
            userId: req.userId,
            userEmail: req.user?.email,
            action: "admin.logs_view",
            severity: "warning",
            ipAddress: this.getIpAddress(req),
            userAgent: req.headers["user-agent"],
            success: "false",
            errorMessage: `User has role '${user.value.role}' but requires one of: ${roles.join(", ")}`,
            description: "User attempted admin action with insufficient role",
            metadata: {
              userRole: user.value.role,
              requiredRoles: roles,
              path: req.path,
            },
          }).catch((err) => logger.error("Failed to log auth event:", err));


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
          // Log authorization failure
          await this.auditService.log({
            userId: req.userId,
            userEmail: req.user?.email,
            action: "admin.logs_view",
            severity: "warning",
            ipAddress: this.getIpAddress(req),
            userAgent: req.headers["user-agent"],
            success: "false",
            errorMessage: "User lacks prerequisite roles",
            description: "User attempted admin action without prerequisite roles",
          }).catch((err) => logger.error("Failed to log auth event:", err));

          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        return next();
      } catch (error) {
        logger.error(error);

        // Log error
        await this.auditService.log({
          userId: req.userId,
          userEmail: req.user?.email,
          action: "admin.logs_view",
          severity: "error",
          ipAddress: this.getIpAddress(req),
          userAgent: req.headers["user-agent"],
          success: "false",
          errorMessage: error instanceof Error ? error.message : "Permission check error",
          description: "Error while checking admin permissions",
        }).catch((err) => logger.error("Failed to log auth event:", err));

        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }
    };
  };

  /**
   * Middleware to require user role (job seeker).
   * @param req The Express request object.
   * @param res The Express response object.
   * @param next The next middleware function.
   */
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
        // Log authorization failure
        await this.auditService.log({
          userId: req.userId,
          userEmail: req.user?.email,
          action: "application.create",
          severity: "warning",
          ipAddress: this.getIpAddress(req),
          userAgent: req.headers["user-agent"],
          success: "false",
          errorMessage: "User cannot seek jobs - no user profile",
          description: "User attempted job seeker action without proper profile",
        }).catch((err) => logger.error("Failed to log auth event:", err));
        
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

  /**
   * Middleware to require an active user.
   * @param req The Express request object.
   * @param res The Express response object.
   * @param next The next middleware function.
   */
  requireActiveUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user || req.user.status !== "active") {
      // Log authorization failure
      await this.auditService.log({
        userId: req.userId,
        userEmail: req.user?.email,
        action: "user.update",
        severity: "warning",
        ipAddress: this.getIpAddress(req),
        userAgent: req.headers["user-agent"],
        success: "false",
        errorMessage: "User account is not active",
        description: "Inactive user attempted to perform action",
      }).catch((err) => logger.error("Failed to log auth event:", err));

      return res.status(401).json({
        success: false,
        status: "error",
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }
    return next();
  };

  /**
   * Middleware to ensure the user is a member of the specified organization.
   * @param req The Express request object with organization params.
   * @param res The Express response object.
   * @param next The next middleware function.
   */
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
        // Log authorization failure
        await this.auditService.log({
          userId: req.userId,
          userEmail: req.user?.email,
          action: "organization.update",
          severity: "warning",
          resourceType: "organization",
          resourceId: Number(req.params.organizationId),
          ipAddress: this.getIpAddress(req),
          userAgent: req.headers["user-agent"],
          success: "false",
          errorMessage: "User is not a member of this organization",
          description: "User attempted to access organization they don't belong to",
        }).catch((err) => logger.error("Failed to log auth event:", err));

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

  /**
   * Middleware to require ownership of the account.
   * @param req The Express request object with user params.
   * @param res The Express response object.
   * @param next The next middleware function.
   */
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
        // Log authorization failure
        await this.auditService.log({
          userId: req.userId,
          userEmail: req.user?.email,
          action: "user.update",
          severity: "warning",
          resourceType: "user",
          resourceId: Number(req.params.id),
          ipAddress: this.getIpAddress(req),
          userAgent: req.headers["user-agent"],
          success: "false",
          errorMessage: "User attempted to access another user's account",
          description: `User ${req.userId} attempted to access account ${req.params.id}`,
        }).catch((err) => logger.error("Failed to log auth event:", err));

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

  /**
   * Middleware to ensure ownership of the job application.
   * @param req The Express request object with application params.
   * @param res The Express response object.
   * @param next The next middleware function.
   */
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
        // Log authorization failure
        await this.auditService.log({
          userId: req.userId,
          userEmail: req.user?.email,
          action: "application.withdraw",
          severity: "warning",
          resourceType: "application",
          resourceId: applicationId,
          ipAddress: this.getIpAddress(req),
          userAgent: req.headers["user-agent"],
          success: "false",
          errorMessage: "User attempted to modify another user's application",
          description: `User ${req.userId} attempted to access application ${applicationId}`,
        }).catch((err) => logger.error("Failed to log auth event:", err));

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

  /**
   * Middleware to ensure ownership of the job.
   * @param req The Express request object with job params.
   * @param res The Express response object.
   * @param next The next middleware function.
   */
  ensureJobOwnership = async (
    req: Request<GetJobSchema["params"]>,
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

      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          status: "error",
          error: "BAD_REQUEST",
          message: "Invalid job ID",
        });
      }

      const job = await this.jobService.getJobById(jobId);
      if (!job || !job.isSuccess) {
        return res.status(404).json({
          success: false,
          status: "error",
          error: "NOT_FOUND",
          message: `Job with Id: ${jobId} not found`,
        });
      }

      const member = await this.organizationService.getOrganizationMember(
        req.userId,
      );

      if (!member.isSuccess) {
        // Log authorization failure
        await this.auditService.log({
          userId: req.userId,
          userEmail: req.user?.email,
          action: "job.delete",
          severity: "warning",
          resourceType: "job",
          resourceId: jobId,
          ipAddress: this.getIpAddress(req),
          userAgent: req.headers["user-agent"],
          success: "false",
          errorMessage: "User does not belong to any organization",
          description: "User attempted to delete job without organization membership",
        }).catch((err) => logger.error("Failed to log auth event:", err));

        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "You do not belong to any organization",
        });
      }

      if (job.value.job.employerId !== member.value.organizationId) {
        // Log authorization failure
        await this.auditService.log({
          userId: req.userId,
          userEmail: req.user?.email,
          action: "job.delete",
          severity: "warning",
          resourceType: "job",
          resourceId: jobId,
          ipAddress: this.getIpAddress(req),
          userAgent: req.headers["user-agent"],
          success: "false",
          errorMessage: "User attempted to delete job from another organization",
          description: `User from org ${member.value.organizationId} attempted to delete job from org ${job.value.job.employerId}`,
        }).catch((err) => logger.error("Failed to log auth event:", err));

        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "You can only delete jobs posted by your organization",
        });
      }

      req.organizationId = member.value.organizationId;

      return next();
    } catch (error) {
      logger.error(error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          status: "error",
          error: "NOT_FOUND",
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        status: "error",
        error: "INTERNAL_SERVER_ERROR",
        message: "Error checking job ownership",
      });
    }
  };

  /**
   * Middleware to require delete job permission.
   * @returns A middleware function that checks if the user has permission to delete jobs.
   */
  requireDeleteJobPermission = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userId || !req.organizationId) {
          return res.status(401).json({
            success: false,
            status: "error",
            error: "UNAUTHORIZED",
            message: "Authentication required",
          });
        }

        const hasPermission =
          await this.organizationService.hasDeletePermission(
            req.userId,
            req.organizationId,
          );

        if (!hasPermission) {
           // Log authorization failure
          await this.auditService.log({
            userId: req.userId,
            userEmail: req.user?.email,
            action: "job.delete",
            severity: "warning",
            ipAddress: this.getIpAddress(req),
            userAgent: req.headers["user-agent"],
            success: "false",
            errorMessage: "User lacks delete job permission",
            description: "User attempted to delete job without proper permissions",
            metadata: {
              organizationId: req.organizationId,
            },
          }).catch((err) => logger.error("Failed to log auth event:", err));
          
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions to delete jobs",
          });
        }

        return next();
      } catch (error) {
        logger.error(error);
        return res.status(500).json({
          success: false,
          status: "error",
          error: "INTERNAL_SERVER_ERROR",
          message: "Error checking delete permissions",
        });
      }
    };
  };
}
