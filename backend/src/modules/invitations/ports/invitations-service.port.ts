import type { Result } from "@shared/result";

/**
 * Details returned when viewing an invitation.
 */
export type OrganizationInvitationDetails = {
  organizationName: string;
  role: "owner" | "admin" | "recruiter" | "member";
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
    role: "owner" | "admin" | "recruiter" | "member",
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
    organizationId: number,
    invitationId: number,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>>;
}
