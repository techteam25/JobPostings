import type {
  OrganizationInvitationDetailsInterface,
  OrganizationInvitation,
} from "@/validations/organization.validation";

export interface InvitationsRepositoryPort {
  /**
   * Finds an invitation by token.
   */
  findInvitationByToken(
    token: string,
  ): Promise<OrganizationInvitationDetailsInterface | undefined>;

  /**
   * Finds an invitation by email and organization ID.
   */
  findInvitationByEmailAndOrg(
    email: string,
    organizationId: number,
  ): Promise<OrganizationInvitation | undefined>;

  /**
   * Creates a new invitation.
   */
  createInvitation(data: {
    organizationId: number;
    email: string;
    role: "owner" | "admin" | "recruiter" | "member";
    token: string;
    invitedBy: number;
    expiresAt: Date;
  }): Promise<OrganizationInvitation | undefined>;

  /**
   * Updates an invitation (for resend/reactivation).
   */
  updateInvitation(
    invitationId: number,
    data: {
      token: string;
      expiresAt: Date;
      status?: "pending" | "accepted" | "expired" | "cancelled";
    },
  ): Promise<OrganizationInvitation | undefined>;

  /**
   * Updates invitation status.
   */
  updateInvitationStatus(
    invitationId: number,
    data: {
      status: "accepted" | "cancelled" | "expired";
      acceptedAt?: Date;
      cancelledAt?: Date;
      cancelledBy?: number;
      expiredAt?: Date;
    },
  ): Promise<OrganizationInvitation | undefined>;

  /**
   * Finds an invitation by ID.
   */
  findInvitationById(
    invitationId: number,
  ): Promise<OrganizationInvitation | undefined>;

  /**
   * Checks if an email is already an active member of an organization.
   */
  isEmailActiveMember(email: string, organizationId: number): Promise<boolean>;

  /**
   * Expires all pending invitations that have passed their expiration date.
   * @returns The number of expired invitations.
   */
  expirePendingInvitations(): Promise<number>;
}
