import { Router, type RequestHandler } from "express";

import { InvitationsService } from "../services/invitations.service";
import { InvitationsController } from "../controllers/invitations.controller";
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
import type { InvitationsRepositoryPort } from "../ports/invitations-repository.port";
import type { OrgMembershipCommandPort } from "../ports/org-membership-command.port";
import type { UserEmailQueryPort } from "../ports/user-email-query.port";
import type { EmailServicePort } from "@/ports/email-service.port";

export function createInvitationsRoutes({
  authenticate,
  orgGuards,
  invitationsGuards,
  invitationsRepository,
  orgMembership,
  userEmailQuery,
  emailService,
}: {
  authenticate: RequestHandler;
  orgGuards: Pick<OrganizationsGuards, "requireAdminOrOwnerRole" | "ensureIsOrganizationMember" | "validateRoleAssignment">;
  invitationsGuards: InvitationsGuards;
  invitationsRepository: InvitationsRepositoryPort;
  orgMembership: OrgMembershipCommandPort;
  userEmailQuery: UserEmailQueryPort;
  emailService: EmailServicePort;
}): Router {
  const router = Router();

  const invitationsService = new InvitationsService(
    invitationsRepository,
    orgMembership,
    userEmailQuery,
    emailService,
  );

  const invitationsController = new InvitationsController(invitationsService);

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
    invitationsController.sendInvitation,
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
    invitationsController.cancelInvitation,
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
    invitationsController.getInvitationDetails,
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
    invitationsController.acceptInvitation,
  );

  return router;
}
