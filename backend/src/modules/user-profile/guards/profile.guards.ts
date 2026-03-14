import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { ProfileRepositoryPort } from "@/modules/user-profile/ports/profile-repository.port";

/**
 * Creates user-profile authorization guards.
 * Handles job seeker capability verification.
 */
export function createProfileGuards(deps: {
  profileRepository: ProfileRepositoryPort;
}) {
  const { profileRepository } = deps;

  /**
   * Checks if the user has job seeker capability (has a user profile).
   * Used to gate job-seeking actions: applying, saving jobs, job alerts.
   *
   * User scenarios:
   *  - Pure Job Seeker: Has users record + userProfile → allowed
   *  - Pure Employer: Has users record + orgMembers, no userProfile → blocked
   *  - Hybrid User: Has users record + userProfile + orgMembers → allowed
   */
  const requireUserRole: RequestHandler = async (
    req: Request,
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

      const userCanSeekJobs = await profileRepository.canSeekJobs(req.userId);

      if (!userCanSeekJobs) {
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

  return {
    requireUserRole,
  };
}

export type ProfileGuards = ReturnType<typeof createProfileGuards>;
