/**
 * Port for organization ownership checks and solo-org teardown from the
 * identity module's perspective. Identity must not import organizations or
 * invitations internals — this ACL is implemented by
 * OrganizationsToIdentityAdapter in src/shared/adapters/.
 */

export type WalkAwayOrg = {
  id: number;
  name: string;
  /** True when the org has ≥1 active admin (used for smart deep links). */
  hasActiveAdmin: boolean;
};

export type WalkAwayClassification = {
  /** Owner + at least one other active member — must transfer or delete first. */
  blocking: WalkAwayOrg[];
  /** Owner is the only active member — deleted as part of walk-away. */
  willBeDeleted: WalkAwayOrg[];
};

export type SoloOrgTeardownResult = "completed" | "aborted";

export interface OrgOwnershipQueryPort {
  classifyOwnedOrgs(userId: number): Promise<WalkAwayClassification>;

  /**
   * Cancel pending invitations and delete the given solo-owned orgs.
   * Re-checks active member counts in the critical section; returns
   * `"aborted"` if any org is no longer solo (no deletes applied).
   */
  teardownSoloOrgs(
    userId: number,
    orgIds: number[],
  ): Promise<SoloOrgTeardownResult>;
}
