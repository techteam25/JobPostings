import type { Result } from "@shared/result";
import type { UserOrganizationInterface } from "@/validations/organization.validation";

/**
 * Port for querying organization role information from the user-profile module's perspective.
 * The user-profile module needs to check if a user has elevated roles
 * in an organization for authorization purposes.
 *
 * Implemented by OrganizationsToProfileAdapter in src/shared/adapters/.
 */
export interface OrgRoleQueryPort {
  checkHasElevatedRole(
    userId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ): Promise<boolean>;
}

/**
 * Port for querying user organization memberships from the user-profile module's perspective.
 * Used by the profile controller to display which organizations a user belongs to.
 *
 * Implemented by OrganizationsToProfileAdapter in src/shared/adapters/.
 */
export interface UserOrganizationsQueryPort {
  getUserOrganizations(
    userId: number,
  ): Promise<Result<UserOrganizationInterface[], Error>>;
}
