import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { ApiResponse } from "@/types";
import { UserService } from "@/services/user.service";
import { JobRepository } from "@/repositories/job.repository";
import { ForbiddenError, NotFoundError } from "@/utils/errors";

import logger from "@/logger";
import { auth } from "@/utils/auth";
import { OrganizationService } from "@/services/organization.service";

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
    next: NextFunction
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

        // Determine if we’re editing an existing job or creating a new one
        const jobId = req.params.jobId ? parseInt(req.params.jobId) : null;
        let employerId: number | null = null;

        if (jobId) {
          // Fetch job to get employerId
          const job = await this.jobRepository.findById(jobId);
          if (!job) {
            return res.status(404).json({
              status: "error",
              message: "Job not found",
            });
          }
          employerId = job.employerId;
        }

        // Get org membership info
        const member = await this.organizationService.getOrganizationMember(
          req.userId
        );
        if (!member) {
          return res.status(403).json({
            message: "You are not part of any organization",
            status: "error",
          });
        }

        // Verify employer ownership when jobId exists
        if (employerId && member.organizationId !== employerId) {
          return res.status(403).json({
            message: "You are not authorized to modify this job",
            status: "error",
          });
        }

        // Check organization existence
        const organization = await this.organizationService.getOrganizationById(
          member.organizationId
        );
        if (!organization) {
          return res.status(404).json({
            status: "error",
            message: "Organization not found",
          });
        }

        // Check if org is active and valid
        if (organization.status !== "active") {
          return res.status(403).json({
            message: "Organization is not active",
            status: "error",
          });
        }

        if (organization.subscriptionStatus === "expired") {
          return res.status(403).json({
            message: "Organization subscription has expired",
            status: "error",
          });
        }

        // Check role permissions
        const permittedRoles = ["owner", "admin", "recruiter"];
        if (!permittedRoles.includes(member.role)) {
          return res.status(403).json({
            status: "error",
            message: "You do not have permission to perform this action",
          });
        }

        req.organizationId = member.organizationId;

        return next();
      } catch (error) {
        logger.error(error);
        return res.status(500).json({
          success: false,
          message: "Error checking job posting permissions",
          status: "error",
        });
      }
    };
  };

  requireAdminOrOwnerRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userId) {
          return res.status(401).json({
            status: "error",
            message: "Authentication required",
          });
        }

        const user = await this.organizationService.getOrganizationMember(
          req.userId
        );

        if (!["owner", "admin"].some((role) => roles.includes(role))) {
          return res.status(500).json({
            status: "error",
            message:
              "Invalid roles configuration. This middleware should only include 'owner' or 'admin'",
          });
        }

        if (!user) {
          // User may be authenticated but not an organization member
          return res.status(403).json({
            status: "error",
            message: "Insufficient permissions",
          });
        }

        if (!roles.includes(user.role)) {
          // Check if user's role is in the permitted roles
          return res.status(403).json({
            status: "error",
            message: "Insufficient permissions",
          });
        }

        // Fetch user to check role
        const isPermitted = await this.userService.hasPrerequisiteRoles(
          req.userId,
          ["owner", "admin"]
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

  requireActiveUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user || req.user.status !== "active") {
      return res.status(403).json({
        status: "error",
        message: "User account is not active",
      });
    }
    return next();
  };

  requireApplicationOwnership = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userId) {
          return res.status(401).json({
            status: "error",
            message: "Authentication required",
          });
        }

        // Extract applicationId from request params or body
        const applicationId = parseInt(req.params.applicationId as string);

        if (!applicationId || isNaN(applicationId)) {
          return res.status(400).json({
            status: "error",
            message: "Application ID is required",
          });
        }

        // Fetch application details
        const [applicationData] =
          await this.jobRepository.findApplicationById(applicationId);

        if (!applicationData) {
          return res.status(404).json({
            status: "error",
            message: "Application not found",
          });
        }

        // Check ownership
        if (applicationData.application.applicantId !== req.userId) {
          return res.status(403).json({
            status: "error",
            message: "You can only withdraw your own applications",
          });
        }

        if (
          ["hired", "rejected"].includes(applicationData.application.status)
        ) {
          return res.status(403).json({
            status: "error",
            message: "Cannot withdraw application with final status",
          });
        }

        // Attach application data to request for controller use
        //req.applicationData = applicationData;

        return next();
      } catch (error) {
        logger.error(error);
        return res.status(500).json({
          status: "error",
          message: "Error checking application ownership",
        });
      }
    };
  };
}
