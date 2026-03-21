import type { OrganizationsRepositoryPort } from "@/modules/organizations";
import type { OrgMembershipQueryPort } from "@/modules/applications";

/**
 * Adapter bridging the organizations repository into the applications module's
 * OrgMembershipQueryPort. Provides membership lookup for authorization checks
 * without coupling applications to organizations internals.
 */
export class OrganizationsToApplicationsAdapter implements OrgMembershipQueryPort {
  constructor(
    private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) {}

  async findByContact(
    contactId: number,
    organizationId: number,
  ): Promise<{ id: number } | null> {
    try {
      const member = await this.organizationsRepository.findByContact(
        contactId,
        organizationId,
      );

      if (!member) {
        return null;
      }

      return { id: member.id };
    } catch {
      // OrganizationsRepository throws NotFoundError when member doesn't exist.
      // The applications module expects null for "not a member".
      return null;
    }
  }
}
