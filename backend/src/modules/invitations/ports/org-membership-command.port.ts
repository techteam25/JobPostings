/**
 * Cross-module port for the invitations module to create members and
 * check existing memberships without importing directly from the
 * `organizations` module.
 */
export interface OrgMembershipCommandPort {
  /**
   * Creates an organization member record.
   */
  createMember(data: {
    userId: number;
    organizationId: number;
    role: "owner" | "admin" | "recruiter" | "member";
  }): Promise<
    { userId: number; organizationId: number; role: string } | undefined
  >;

  /**
   * Finds an organization member by contact (user) ID.
   * Returns null if the user is not a member of the organization.
   */
  findByContact(
    contactId: number,
    organizationId: number,
  ): Promise<{ id: number; role: string } | null>;

  /**
   * Gets the name of an organization by its ID.
   * Returns null if the organization does not exist.
   */
  getOrganizationName(organizationId: number): Promise<string | null>;
}
