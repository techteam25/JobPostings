import type { OrgMembershipCommandPort } from "@/modules/invitations";
import type { OrganizationRole } from "@/validations/organization.validation";

/**
 * Adapter bridging the organizations repository into the invitations module's
 * OrgMembershipCommandPort. Provides member creation and organization lookup
 * without coupling invitations to organizations internals.
 *
 * This adapter uses the organizations repository port type once the module
 * is created. During the transition, it accepts the concrete repository
 * typed as the new port.
 */
export class OrganizationsToInvitationsAdapter implements OrgMembershipCommandPort {
  constructor(
    private readonly organizationsRepository: {
      createMember(data: {
        userId: number;
        organizationId: number;
        role: OrganizationRole;
      }): Promise<
        | { userId: number; organizationId: number; role: OrganizationRole }
        | undefined
      >;
      findByContact(
        contactId: number,
        organizationId: number,
      ): Promise<{ id: number; role: OrganizationRole } | null>;
      findById(
        id: number,
      ): Promise<
        { id: number; name: string; [key: string]: unknown } | undefined
      >;
    },
  ) {}

  async createMember(data: {
    userId: number;
    organizationId: number;
    role: OrganizationRole;
  }): Promise<
    | { userId: number; organizationId: number; role: OrganizationRole }
    | undefined
  > {
    return this.organizationsRepository.createMember(data);
  }

  async findByContact(
    contactId: number,
    organizationId: number,
  ): Promise<{ id: number; role: OrganizationRole } | null> {
    const member = await this.organizationsRepository.findByContact(
      contactId,
      organizationId,
    );

    if (!member) {
      return null;
    }

    return {
      id: member.id,
      role: member.role,
    };
  }

  async getOrganizationName(organizationId: number): Promise<string | null> {
    const org = await this.organizationsRepository.findById(organizationId);

    if (!org) {
      return null;
    }

    return org.name;
  }
}
