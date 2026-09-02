import type { Result } from "@shared/result";
import type { OrganizationsRepositoryPort } from "@/modules/organizations";
import type {
  OrgOwnershipQueryPort,
  SoloOrgTeardownResult,
  WalkAwayClassification,
} from "@/modules/identity";

export type OrganizationsToIdentityTeardownDeps = {
  deleteOrganization: (
    organizationId: number,
  ) => Promise<Result<{ message: string }, Error>>;
  cancelAllPendingForOrganization: (
    organizationId: number,
    cancelledBy: number,
  ) => Promise<Result<{ cancelledCount: number }, Error>>;
};

/**
 * Adapter bridging the organizations (and invitations, via late-bound
 * teardown deps) into the identity module's OrgOwnershipQueryPort.
 */
export class OrganizationsToIdentityAdapter implements OrgOwnershipQueryPort {
  private teardownDeps: OrganizationsToIdentityTeardownDeps | null = null;

  constructor(
    private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) {}

  /**
   * Bind org-delete + invitation-cancel after those modules are constructed.
   * Identity is composed before organizations/invitations; teardown needs both.
   */
  bindTeardown(deps: OrganizationsToIdentityTeardownDeps): void {
    this.teardownDeps = deps;
  }

  async classifyOwnedOrgs(userId: number): Promise<WalkAwayClassification> {
    return this.organizationsRepository.classifyOwnedOrgs(userId);
  }

  async teardownSoloOrgs(
    userId: number,
    orgIds: number[],
  ): Promise<SoloOrgTeardownResult> {
    if (orgIds.length === 0) return "completed";

    if (!this.teardownDeps) {
      throw new Error(
        "OrganizationsToIdentityAdapter teardown deps were not bound",
      );
    }

    const stillSolo = await this.assertStillSolo(userId, orgIds);
    if (!stillSolo) return "aborted";

    for (const orgId of orgIds) {
      const cancelResult =
        await this.teardownDeps.cancelAllPendingForOrganization(orgId, userId);
      if (cancelResult.isFailure) {
        throw cancelResult.error;
      }
    }

    const stillSoloAfterCancel = await this.assertStillSolo(userId, orgIds);
    if (!stillSoloAfterCancel) return "aborted";

    for (const orgId of orgIds) {
      const stillSoloForOrg = await this.assertStillSolo(userId, [orgId]);
      if (!stillSoloForOrg) return "aborted";

      const deleteResult = await this.teardownDeps.deleteOrganization(orgId);
      if (deleteResult.isFailure) {
        throw deleteResult.error;
      }
    }

    return "completed";
  }

  private async assertStillSolo(
    userId: number,
    orgIds: number[],
  ): Promise<boolean> {
    const classification =
      await this.organizationsRepository.classifyOwnedOrgs(userId);
    const soloIds = new Set(classification.willBeDeleted.map((o) => o.id));
    const blockingIds = new Set(classification.blocking.map((o) => o.id));

    for (const orgId of orgIds) {
      if (blockingIds.has(orgId) || !soloIds.has(orgId)) {
        return false;
      }
    }
    return true;
  }
}
