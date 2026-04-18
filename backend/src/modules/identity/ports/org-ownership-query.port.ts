/**
 * Port for querying organization ownership from the identity module's
 * perspective. The identity module needs to know if a user is the sole
 * owner of any organizations before allowing account deletion — if so,
 * deletion is blocked so the orgs don't get orphaned.
 *
 * Implemented by OrganizationsToIdentityAdapter in src/shared/adapters/.
 */
export interface OrgOwnershipQueryPort {
  findSoleOwnedOrgs(userId: number): Promise<{ id: number; name: string }[]>;
}
