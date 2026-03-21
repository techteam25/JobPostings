import { Router, type RequestHandler } from "express";

import type { InvitationsController } from "../controllers/invitations.controller";
import type { OrganizationsGuards } from "@/modules/organizations";
import type { InvitationsGuards } from "@/modules/invitations";
import validate from "@/middleware/validation.middleware";
import {
  createOrganizationInvitationSchema,
  cancelOrganizationInvitationSchema,
  getOrganizationInvitationDetailsSchema,
  acceptOrganizationInvitationSchema,
} from "@/validations/organization.validation";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

export function createInvitationsRoutes({
  authenticate,
  orgGuards,
  invitationsGuards,
  controller,
}: {
  authenticate: RequestHandler;
  orgGuards: Pick<
    OrganizationsGuards,
    | "requireAdminOrOwnerRole"
    | "ensureIsOrganizationMember"
    | "validateRoleAssignment"
  >;
  invitationsGuards: InvitationsGuards;
  controller: InvitationsController;
}): Router {
  const router = Router();

  /**
   * Sends an invitation to join an organization.
   * Requires authentication, owner/admin role, and membership in the organization.
   * Validates role assignment permissions.
   * @route POST /:organizationId/invitations
   */
  router.post(
    "/:organizationId/invitations",
    authenticate,
    orgGuards.requireAdminOrOwnerRole(["owner", "admin"]),
    orgGuards.ensureIsOrganizationMember,
    validate(createOrganizationInvitationSchema),
    orgGuards.validateRoleAssignment,
    controller.sendInvitation,
  );

  /**
   * Cancels an organization invitation (authenticated endpoint, admin/owner only).
   * Performs soft delete by updating status to 'cancelled' and preserving audit trail.
   * Requires authentication, owner/admin role, membership in the organization,
   * and validates that the invitation belongs to the specified organization.
   * @route DELETE /:organizationId/invitations/:invitationId
   */
  router.delete(
    "/:organizationId/invitations/:invitationId",
    authenticate,
    orgGuards.requireAdminOrOwnerRole(["owner", "admin"]),
    orgGuards.ensureIsOrganizationMember,
    validate(cancelOrganizationInvitationSchema),
    invitationsGuards.ensureInvitationBelongsToOrganization,
    controller.cancelInvitation,
  );

  /**
   * Gets invitation details by token (public endpoint).
   * Allows anyone with a valid invitation token to view invitation details
   * without authentication.
   * @route GET /:organizationId/:token/details
   */
  router.get(
    "/:organizationId/:token/details",
    validate(getOrganizationInvitationDetailsSchema),
    controller.getInvitationDetails,
  );

  /**
   * Accepts an organization invitation (authenticated endpoint).
   * Validates that the invitation token is valid and not expired,
   * the invitation status is 'pending', and the authenticated user's
   * email matches the invitation email.
   * @route POST /:organizationId/:token/accept
   */
  router.post(
    "/:organizationId/:token/accept",
    authenticate,
    validate(acceptOrganizationInvitationSchema),
    invalidateCacheMiddleware((req) => `organizations/members/${req.userId}`),
    controller.acceptInvitation,
  );

  return router;
}
