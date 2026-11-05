import type { RequestHandler } from "express";

import type { InvitationsRepositoryPort } from "@/modules/invitations/ports/invitations-repository.port";
import type { CancelOrganizationInvitationInput } from "@/validations/organization.validation";
import logger from "@shared/logger";

/**
 * Creates invitations authorization guards.
 * Handles invitation ownership verification.
 */
export function createInvitationsGuards(deps: {
  invitationsRepository: InvitationsRepositoryPort;
}) {
  const { invitationsRepository } = deps;

  /**
   * Ensures the invitation belongs to the specified organization.
   * Sets req.invitation on success for downstream use.
   * Requires req.params.organizationId and req.params.invitationId.
   */
  const ensureInvitationBelongsToOrganization: RequestHandler<
    CancelOrganizationInvitationInput["params"]
  > = async (req, res, next) => {
    try {
      const organizationId = Number(req.params.organizationId);
      const invitationId = Number(req.params.invitationId);

      if (isNaN(organizationId) || isNaN(invitationId)) {
        return res.status(400).json({
          success: false,
          status: "error",
          error: "BAD_REQUEST",
          message: "Invalid organization ID or invitation ID",
        });
      }

      const invitation =
        await invitationsRepository.findInvitationById(invitationId);

      if (!invitation) {
        return res.status(404).json({
          success: false,
          status: "error",
          error: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.organizationId !== organizationId) {
        return res.status(403).json({
          success: false,
          status: "error",
          error: "FORBIDDEN",
          message: "This invitation does not belong to your organization",
        });
      }

      req.invitation = invitation;

      return next();
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        status: "error",
        error: "INTERNAL_SERVER_ERROR",
        message: "Error validating invitation ownership",
      });
    }
  };

  return {
    ensureInvitationBelongsToOrganization,
  };
}

export type InvitationsGuards = ReturnType<typeof createInvitationsGuards>;
