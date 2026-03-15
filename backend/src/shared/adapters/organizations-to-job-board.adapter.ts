import type { OrganizationsRepositoryPort } from "@/modules/organizations";
import type { OrgMembershipForJobPort } from "@/modules/job-board";

/**
 * Adapter bridging the organizations repository into the job-board module's
 * OrgMembershipForJobPort. Provides membership lookup for job ownership
 * verification without coupling job-board to organizations internals.
 */
export class OrganizationsToJobBoardAdapter implements OrgMembershipForJobPort {
  constructor(
    private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) {}

  async findByContact(
    contactId: number,
    organizationId: number,
  ): Promise<{ organizationId: number } | null> {
    try {
      const member = await this.organizationsRepository.findByContact(
        contactId,
        organizationId,
      );

      if (!member) {
        return null;
      }

      return { organizationId: member.organizationId };
    } catch {
      // OrganizationsRepository throws NotFoundError when member doesn't exist.
      // The job-board module expects null for "not a member".
      return null;
    }
  }
}
