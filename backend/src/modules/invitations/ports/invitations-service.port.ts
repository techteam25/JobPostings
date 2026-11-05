import type { Result } from "@shared/result";
import type {
  OrganizationRole,
  PendingOrganizationInvitation,
} from "@/validations/organization.validation";

/**
 * Details returned when viewing an invitation.
 */
export type OrganizationInvitationDetails = {
  organizationName: string;
  role: OrganizationRole;
  inviterName: string;
  expiresAt: Date;
};

export interface InvitationsServicePort {
  /**
   * Sends an invitation to join an organization.
   */
  sendInvitation(
    organizationId: number,
    email: string,
    role: OrganizationRole,
    requesterId: number,
  ): Promise<Result<{ invitationId: number; message: string }, Error>>;

  /**
   * Gets invitation details by token (public endpoint).
   */
  getInvitationDetails(
    token: string,
    organizationId: number,
  ): Promise<Result<OrganizationInvitationDetails, Error>>;

  /**
   * Accepts an organization invitation.
   */
  acceptInvitation(
    token: string,
    userId: number,
    organizationId: number,
  ): Promise<Result<{ message: string }, Error>>;

  /**
   * Cancels an organization invitation (soft delete).
   */
  cancelInvitation(
    invitationId: number,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>>;

  /**
   * Lists pending invitations for an organization.
   */
  listPendingInvitations(
    organizationId: number,
  ): Promise<Result<PendingOrganizationInvitation[], Error>>;

  /**
   * Cancels all pending invitations for an organization (used by walk-away teardown).
   */
  cancelAllPendingForOrganization(
    organizationId: number,
    cancelledBy: number,
  ): Promise<Result<{ cancelledCount: number }, Error>>;
}
