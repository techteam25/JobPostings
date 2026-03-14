import type { RequestHandler } from "express";

import type { GetUserSchema } from "@/validations/user.validation";

/**
 * Creates identity authorization guards.
 * Handles self-ownership verification.
 */
export function createIdentityGuards() {
  /**
   * Ensures the authenticated user is accessing their own account.
   * Compares req.userId with req.params.id.
   */
  const requireOwnAccount: RequestHandler<GetUserSchema["params"]> = async (
    req,
    res,
    next,
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

  return {
    requireOwnAccount,
  };
}

export type IdentityGuards = ReturnType<typeof createIdentityGuards>;
