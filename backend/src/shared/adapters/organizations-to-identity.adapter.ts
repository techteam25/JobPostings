import type { OrganizationsRepositoryPort } from "@/modules/organizations";
import type { OrgOwnershipQueryPort } from "@/modules/identity";

/**
 * Adapter bridging the organizations module into the identity module's
 * OrgOwnershipQueryPort. Exposes sole-owner queries needed by account
 * deletion flows without coupling identity to organizations internals.
 */
export class OrganizationsToIdentityAdapter implements OrgOwnershipQueryPort {
  constructor(
    private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) {}

  async findSoleOwnedOrgs(
    userId: number,
  ): Promise<{ id: number; name: string }[]> {
    return this.organizationsRepository.findSoleOwnedOrgs(userId);
  }
}
