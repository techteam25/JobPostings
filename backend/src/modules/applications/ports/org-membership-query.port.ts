/**
 * Port for querying organization membership from the applications module's
 * perspective. The applications module needs to verify that a requester
 * belongs to the organization that posted a job before allowing access
 * to applications.
 *
 * Implemented by an adapter in src/shared/adapters/.
 */
export interface OrgMembershipQueryPort {
  findByContact(
    contactId: number,
    organizationId: number,
  ): Promise<{ id: number } | null>;
}
