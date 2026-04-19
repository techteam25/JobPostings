import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { OrganizationsRepositoryPort } from "@/modules/organizations/ports/organizations-repository.port";
import type { GetOrganizationSchema } from "@/validations/organization.validation";
import { NotFoundError } from "@shared/errors";
import logger from "@shared/logger";

type OrgRole = "owner" | "admin" | "recruiter" | "member";

/**
 * Gets the numeric level for a role (higher = more permissions).
 */
function getRoleLevel(role: OrgRole): number {
  const roleLevels: Record<OrgRole, number> = {
    owner: 4,
    admin: 3,
    recruiter: 2,
    member: 1,
  };
  return roleLevels[role];
}

/**
 * Validates if the inviter can assign the requested role based on role hierarchy.
 * Can only assign roles lower than your own.
 */
function canAssignRole(inviterRole: OrgRole, requestedRole: OrgRole): boolean {
  return getRoleLevel(requestedRole) < getRoleLevel(inviterRole);
}

/**
 * Creates organization authorization guards.
 * Handles org membership, role checks, and permission validation.
 */
export function createOrganizationsGuards(deps: {
  organizationsRepository: OrganizationsRepositoryPort;
}) {
  const { organizationsRepository } = deps;

  /**
   * Checks if the user has permission to post jobs (employer role in any org).
   * Sets req.organizationId on success.
   */
  const requireJobPostingRole = (): RequestHandler => {
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

        const isPermitted = await organizationsRepository.canPostJobs(
          req.userId,
        );

        if (!isPermitted) {
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        // Use organizationId from URL params if available, otherwise derive from membership
        let member;
        if (req.params.organizationId) {
          member = await organizationsRepository.findByContact(
            req.userId,
            Number(req.params.organizationId),
          );
        } else {
          member = await organizationsRepository.findMemberByUserId(req.userId);
        }

        if (!member) {
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        req.organizationId = member.organizationId;

        return next();
      } catch (error) {
        if (error instanceof NotFoundError) {
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }
        return res.status(500).json({
          success: false,
          status: "error",
          error: "INTERNAL_SERVER_ERROR",
          message: "Error checking user permissions",
        });
      }
    };
  };

  /**
   * Checks if the user has the required admin/owner role in the organization.
   * Requires req.params.organizationId.
   */
  const requireAdminOrOwnerRole = (roles: string[]): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userId || !req.params.organizationId) {
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

        const member = await organizationsRepository.findByContact(
          req.userId,
          Number(req.params.organizationId),
        );

        if (!member) {
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        if (!roles.includes(member.role)) {
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        // Verify user has elevated role across organizations
        const hasElevatedRole =
          await organizationsRepository.checkHasElevatedRole(req.userId, [
            "owner",
            "admin",
          ]);

        if (!hasElevatedRole) {
          return res.status(403).json({
            success: false,
            status: "error",
            error: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }

        return next();
      } catch {
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
   * Ensures the user is a member of the specified organization.
   * Requires req.params.organizationId.
   */
  const ensureIsOrganizationMember: RequestHandler<
    GetOrganizationSchema["params"]
  > = async (req, res, next) => {
    try {
      if (!req.userId || !req.params.organizationId) {
        return res.status(401).json({
          success: false,
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      const member = await organizationsRepository.findByContact(
        req.userId,
        Number(req.params.organizationId),
      );

      console.log({ member });

      if (
        !member ||
        member.organizationId !== Number(req.params.organizationId)
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
      if (error instanceof NotFoundError) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }
      return res.status(500).json({
        success: false,
        status: "error",
        error: "INTERNAL_SERVER_ERROR",
        message: "Error checking user permissions",
      });
    }
  };

  /**
   * Checks if the user has permission to delete jobs in the organization.
   * Requires req.userId and req.organizationId to be set by prior middleware.
   */
  const requireDeleteJobPermission = (): RequestHandler => {
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

        const hasPermission = await organizationsRepository.hasDeletePermission(
          req.userId,
          req.organizationId,
        );

        if (!hasPermission) {
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

  /**
   * Validates that the requester can assign the requested role based on hierarchy.
   * Must be used after ensureIsOrganizationMember.
   */
  const validateRoleAssignment: RequestHandler<
    GetOrganizationSchema["params"]
  > = async (req, res, next) => {
    try {
      if (!req.userId || !req.params.organizationId) {
        return res.status(401).json({
          success: false,
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      const requestedRole = (req.body as { role?: string })?.role;
      if (!requestedRole) {
        return res.status(400).json({
          success: false,
          status: "error",
          error: "BAD_REQUEST",
          message: "Role is required",
        });
      }

      const requesterMember = await organizationsRepository.findByContact(
        req.userId,
        Number(req.params.organizationId),
      );

      if (!requesterMember) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }

      const isAllowed = canAssignRole(
        requesterMember.role as OrgRole,
        requestedRole as OrgRole,
      );

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: `You cannot assign the ${requestedRole} role. You can only assign roles lower than your own.`,
        });
      }

      return next();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }
      logger.error(error);
      return res.status(500).json({
        success: false,
        status: "error",
        error: "INTERNAL_SERVER_ERROR",
        message: "Error validating role assignment",
      });
    }
  };

  return {
    requireJobPostingRole,
    requireAdminOrOwnerRole,
    ensureIsOrganizationMember,
    requireDeleteJobPermission,
    validateRoleAssignment,
  };
}

export type OrganizationsGuards = ReturnType<typeof createOrganizationsGuards>;
