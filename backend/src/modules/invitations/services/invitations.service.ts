import { fail, ok, Result } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import { randomUUID } from "crypto";

import {
  AppError,
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@shared/errors";

import type {
  InvitationsServicePort,
  OrganizationInvitationDetails,
} from "../ports/invitations-service.port";
import type { InvitationsRepositoryPort } from "../ports/invitations-repository.port";
import type { OrgMembershipCommandPort } from "../ports/org-membership-command.port";
import type { UserEmailQueryPort } from "../ports/user-email-query.port";
import type { EmailServicePort } from "@shared/ports/email-service.port";

/**
 * Service class for managing organization invitation operations.
 */
export class InvitationsService
  extends BaseService
  implements InvitationsServicePort
{
  constructor(
    private invitationsRepository: InvitationsRepositoryPort,
    private orgMembership: OrgMembershipCommandPort,
    private userEmailQuery: UserEmailQueryPort,
    private emailService: EmailServicePort,
  ) {
    super();
  }

  /**
   * Sends an invitation to join an organization.
   * @param organizationId The ID of the organization.
   * @param email The email address of the invitee.
   * @param role The role to assign.
   * @param requesterId The ID of the user sending the invitation.
   * @returns A Result containing the invitation or an error.
   */
  async sendInvitation(
    organizationId: number,
    email: string,
    role: "owner" | "admin" | "recruiter" | "member",
    requesterId: number,
  ): Promise<Result<{ invitationId: number; message: string }, Error>> {
    try {
      // Note: Authentication, authorization (owner/admin), organization membership,
      // and role assignment permissions are validated by middleware before this method is called.

      // 1. Validate email is not already an active member
      const isActiveMember =
        await this.invitationsRepository.isEmailActiveMember(
          email,
          organizationId,
        );

      if (isActiveMember) {
        return fail(
          new ConflictError(
            "This email is already a member of the organization",
          ),
        );
      }

      // 2. Check for existing invitation
      const existingInvitation =
        await this.invitationsRepository.findInvitationByEmailAndOrg(
          email,
          organizationId,
        );

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      let invitation;

      if (existingInvitation) {
        // Reactivate existing invitation (pending, cancelled, or expired)
        invitation = await this.invitationsRepository.updateInvitation(
          existingInvitation.id,
          {
            token,
            expiresAt,
            status: "pending",
          },
        );
      } else {
        // Create new invitation
        invitation = await this.invitationsRepository.createInvitation({
          organizationId,
          email: email, // Email is already normalized to lowercase by Zod validation
          role,
          token,
          invitedBy: requesterId,
          expiresAt,
        });
      }

      if (!invitation) {
        return fail(new DatabaseError("Failed to create invitation"));
      }

      // Queue invitation email
      const organizationName =
        await this.orgMembership.getOrganizationName(organizationId);
      const inviterName =
        await this.userEmailQuery.getUserNameById(requesterId);

      if (organizationName && inviterName) {
        const expirationDate = new Date(expiresAt);
        const formattedExpirationDate = expirationDate.toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        );

        // Format role for display (capitalize first letter)
        const roleDisplay =
          role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

        await queueService.addJob(
          QUEUE_NAMES.EMAIL_QUEUE,
          "sendOrganizationInvitation",
          {
            userId: requesterId,
            email: email, // Email is already normalized to lowercase by Zod validation
            organizationName,
            inviterName,
            role: roleDisplay,
            token,
            expirationDate: formattedExpirationDate,
          },
        );
      }

      return ok({
        invitationId: invitation.id,
        message: "Invitation sent successfully",
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to send invitation"));
    }
  }

  /**
   * Gets invitation details by token (public endpoint).
   * @param token The invitation token.
   * @param organizationId The ID of the organization (to verify invitation belongs to this org).
   * @returns The invitation details with organization and inviter info.
   */
  async getInvitationDetails(
    token: string,
    organizationId: number,
  ): Promise<Result<OrganizationInvitationDetails, Error>> {
    try {
      const invitation =
        await this.invitationsRepository.findInvitationByToken(token);

      if (!invitation) {
        return fail(new NotFoundError("Invitation not found"));
      }

      // Verify the invitation belongs to the specified organization
      if (invitation.organizationId !== organizationId) {
        return fail(new NotFoundError("Invitation not found"));
      }

      // Check if invitation is expired
      if (new Date() > new Date(invitation.expiresAt)) {
        return fail(new ValidationError("This invitation has expired"));
      }

      // Check if invitation is already accepted
      if (invitation.status !== "pending") {
        return fail(
          new ValidationError(`This invitation has been ${invitation.status}`),
        );
      }

      return ok({
        organizationName: invitation.organization.name,
        role: invitation.role,
        inviterName: invitation.inviter.fullName,
        expiresAt: invitation.expiresAt,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch invitation details"));
    }
  }

  /**
   * Accepts an organization invitation.
   * @param token The invitation token.
   * @param userId The ID of the user accepting the invitation.
   * @param organizationId The ID of the organization.
   * @returns Success message.
   */
  async acceptInvitation(
    token: string,
    userId: number,
    organizationId: number,
  ): Promise<Result<{ message: string }, Error>> {
    try {
      // 1. Find invitation by token
      const invitation =
        await this.invitationsRepository.findInvitationByToken(token);

      if (!invitation) {
        return fail(new NotFoundError("Invitation not found"));
      }

      // 1b. Verify the invitation belongs to the specified organization
      if (invitation.organizationId !== organizationId) {
        return fail(new NotFoundError("Invitation not found"));
      }

      // 2. Validate invitation status
      if (invitation.status !== "pending") {
        return fail(
          new ValidationError(`This invitation has been ${invitation.status}`),
        );
      }

      // 3. Check if invitation is expired
      if (new Date() > new Date(invitation.expiresAt)) {
        return fail(new ValidationError("This invitation has expired"));
      }

      // 4. Get user to verify email matches
      const userInfo = await this.userEmailQuery.getUserById(userId);
      if (!userInfo) {
        return fail(new NotFoundError("User not found"));
      }

      // 5. Verify user's email matches invitation email
      if (userInfo.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return fail(
          new ValidationError(
            "This invitation was sent to a different email address. Please sign in with the email address that received the invitation.",
          ),
        );
      }

      // 6. Check if user is already a member of this organization
      try {
        const existingMember = await this.orgMembership.findByContact(
          userId,
          organizationId,
        );
        if (existingMember) {
          return fail(
            new ConflictError("You are already a member of this organization"),
          );
        }
      } catch (error) {
        // User is not a member of any organization, which is fine
        // Continue with invitation acceptance
        if (!(error instanceof NotFoundError)) {
          return fail(
            new DatabaseError(
              "Failed to verify existing organization membership",
            ),
          );
        }
      }

      // 7. Create organization member record
      await this.orgMembership.createMember({
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
      });

      // 8. Update invitation status to accepted
      await this.invitationsRepository.updateInvitationStatus(invitation.id, {
        status: "accepted",
        acceptedAt: new Date(),
      });

      // 9. Queue welcome email
      const organizationName = await this.orgMembership.getOrganizationName(
        invitation.organizationId,
      );
      if (organizationName) {
        // Format role for display
        const roleDisplay =
          invitation.role.charAt(0).toUpperCase() +
          invitation.role.slice(1).toLowerCase();

        await queueService.addJob(
          QUEUE_NAMES.EMAIL_QUEUE,
          "sendOrganizationWelcome",
          {
            userId,
            email: invitation.email,
            name: userInfo.fullName,
            organizationName,
            role: roleDisplay,
          },
        );
      }

      return ok({
        message: "Invitation accepted successfully",
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to accept invitation"));
    }
  }

  /**
   * Cancels an organization invitation (soft delete).
   * @param organizationId The organization ID.
   * @param invitationId The invitation ID.
   * @param requesterId The ID of the user canceling the invitation.
   * @returns Success message.
   */
  async cancelInvitation(
    organizationId: number,
    invitationId: number,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>> {
    try {
      // Note: Authentication, authorization (owner/admin), organization membership,
      // and invitation ownership are validated by middleware before this method is called.

      // 1. Find invitation
      const invitation =
        await this.invitationsRepository.findInvitationById(invitationId);

      if (!invitation) {
        return fail(new NotFoundError("Invitation not found"));
      }

      // 2. Check if invitation can be cancelled
      if (invitation.status === "accepted") {
        return fail(
          new ValidationError("Cannot cancel an already accepted invitation"),
        );
      }

      if (invitation.status === "cancelled") {
        return fail(new ValidationError("Invitation is already cancelled"));
      }

      // 3. Update invitation status to cancelled
      await this.invitationsRepository.updateInvitationStatus(invitationId, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: requesterId,
      });

      return ok({
        message: "Invitation cancelled successfully",
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to cancel invitation"));
    }
  }
}
