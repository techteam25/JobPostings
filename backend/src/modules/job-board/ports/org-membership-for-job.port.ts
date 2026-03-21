/**
 * Cross-module port for the job-board module to verify organization membership
 * and existence. Used by guards (membership checks) and the service
 * (org existence validation, membership verification for updates).
 *
 * Implemented by OrganizationsToJobBoardAdapter in src/shared/adapters/.
 */
export interface OrgMembershipForJobPort {
  findByContact(
    contactId: number,
    organizationId: number,
  ): Promise<{ organizationId: number } | null>;

  /** Check whether an organization exists (for job creation validation). */
  organizationExists(organizationId: number): Promise<boolean>;
}
