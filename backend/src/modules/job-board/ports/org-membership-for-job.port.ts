/**
 * Cross-module port for the job-board module to verify organization membership.
 * Used by job-board authorization guards to check if a user belongs to the
 * organization that posted a job.
 *
 * Implemented by an adapter in src/shared/adapters/.
 */
export interface OrgMembershipForJobPort {
  findByContact(
    contactId: number,
    organizationId: number,
  ): Promise<{ organizationId: number } | null>;
}
