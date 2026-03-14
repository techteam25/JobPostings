import type { RequestHandler } from "express";

import type { ApplicationsRepositoryPort } from "@/modules/applications/ports/applications-repository.port";
import type { GetJobApplicationSchema } from "@/validations/jobApplications.validation";
import logger from "@shared/logger";

/**
 * Creates applications authorization guards.
 * Handles application ownership verification.
 */
export function createApplicationsGuards(deps: {
  applicationsRepository: ApplicationsRepositoryPort;
}) {
  const { applicationsRepository } = deps;

  /**
   * Ensures the authenticated user owns the specified job application.
   * Requires req.params.applicationId.
   */
  const ensureApplicationOwnership: RequestHandler<
    GetJobApplicationSchema["params"]
  > = async (req, res, next) => {
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
        await applicationsRepository.findApplicationById(applicationId);

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

  return {
    ensureApplicationOwnership,
  };
}

export type ApplicationsGuards = ReturnType<typeof createApplicationsGuards>;
