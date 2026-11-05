import type { RequestHandler } from "express";

import type { JobBoardRepositoryPort } from "@/modules/job-board/ports/job-board-repository.port";
import type { OrgMembershipForJobPort } from "@/modules/job-board/ports/org-membership-for-job.port";
import type { GetJobSchema } from "@/validations/job.validation";
import { NotFoundError } from "@shared/errors";
import logger from "@shared/logger";

/**
 * Creates job-board authorization guards.
 * Handles job ownership verification.
 */
export function createJobBoardGuards(deps: {
  jobBoardRepository: JobBoardRepositoryPort;
  orgMembershipQuery: OrgMembershipForJobPort;
}) {
  const { jobBoardRepository, orgMembershipQuery } = deps;

  /**
   * Ensures the authenticated user's organization owns the specified job.
   * Sets req.organizationId on success.
   * Requires req.params.jobId.
   */
  const ensureJobOwnership: RequestHandler<GetJobSchema["params"]> = async (
    req,
    res,
    next,
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

      const jobId = Number(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          status: "error",
          error: "BAD_REQUEST",
          message: "Invalid job ID",
        });
      }

      const jobResult = await jobBoardRepository.findJobById(jobId);
      if (!jobResult) {
        return res.status(404).json({
          success: false,
          status: "error",
          error: "NOT_FOUND",
          message: `Job with Id: ${jobId} not found`,
        });
      }

      const member = await orgMembershipQuery.findByContact(
        req.userId,
        jobResult.job.employerId,
      );

      if (!member) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "You do not belong to any organization",
        });
      }

      if (jobResult.job.employerId !== member.organizationId) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "You can only delete jobs posted by your organization",
        });
      }

      req.organizationId = member.organizationId;

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

  return {
    ensureJobOwnership,
  };
}

export type JobBoardGuards = ReturnType<typeof createJobBoardGuards>;
