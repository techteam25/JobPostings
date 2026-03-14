import type { OrganizationsRepositoryPort } from "@/modules/organizations/ports/organizations-repository.port";
import type { OrganizationsServicePort } from "@/modules/organizations/ports/organizations-service.port";
import type { OrgRoleQueryPort, UserOrganizationsQueryPort } from "@/modules/user-profile/ports/org-query.port";
import type { Result } from "@shared/result";
import type { UserOrganizationInterface } from "@/validations/organization.validation";

/**
 * Adapter bridging the organizations module into the user-profile module's
 * OrgRoleQueryPort and UserOrganizationsQueryPort. Provides organization
 * role checks and membership lookups without coupling user-profile to
 * organizations internals.
 */
export class OrganizationsToProfileAdapter
  implements OrgRoleQueryPort, UserOrganizationsQueryPort
{
  constructor(
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    private readonly organizationsService: OrganizationsServicePort,
  ) {}

  async checkHasElevatedRole(
    userId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ): Promise<boolean> {
    return this.organizationsRepository.checkHasElevatedRole(userId, roles);
  }

  async getUserOrganizations(
    userId: number,
  ): Promise<Result<UserOrganizationInterface[], Error>> {
    return this.organizationsService.getUserOrganizations(userId);
  }
}
