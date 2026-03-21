import type { Result } from "@shared/result";
import type {
  NewOrganization,
  OrganizationSearchResultInterface,
  OrganizationWithMembersInterface,
  OrganizationMemberInterface,
  OrganizationMember,
  OrganizationWithMembers,
  UserOrganizationInterface,
} from "@/validations/organization.validation";

/**
 * Port interface for OrganizationsService.
 * Defines the contract for organization CRUD and membership operations.
 * Does NOT include invitation or employer-facing application methods
 * (those belong to their respective modules).
 */
export interface OrganizationsServicePort {
  getAllOrganizations(options?: {
    page?: number;
    limit?: number;
    searchTerm?: string;
  }): Promise<Result<OrganizationSearchResultInterface, Error>>;

  getOrganizationById(
    id: number,
  ): Promise<Result<OrganizationWithMembersInterface, Error>>;

  createOrganization(
    organizationData: NewOrganization,
    sessionUserId: number,
    correlationId: string,
  ): Promise<Result<OrganizationWithMembersInterface, Error>>;

  uploadOrganizationLogo(
    userId: number,
    organizationId: number,
    logoFile: Express.Multer.File,
    correlationId: string,
  ): Promise<Result<{ message: string }, Error>>;

  updateOrganization(
    id: number,
    updateData: Partial<NewOrganization>,
  ): Promise<Result<OrganizationWithMembersInterface, Error>>;

  deleteOrganization(id: number): Promise<Result<{ message: string }, Error>>;

  isRolePermitted(userId: number): Promise<Result<boolean, Error>>;

  isRolePermittedToRejectApplications(
    userId: number,
    organizationId: number,
  ): Promise<Result<boolean, Error>>;

  getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ): Promise<Result<OrganizationWithMembers, Error>>;

  getOrganizationMember(
    sessionUserId: number,
    organizationId: number,
  ): Promise<Result<OrganizationMemberInterface, Error>>;

  getFirstOrganizationForUser(
    userId: number,
  ): Promise<Result<OrganizationMember, Error>>;

  getUserOrganizations(
    userId: number,
  ): Promise<Result<UserOrganizationInterface[], Error>>;

  hasDeletePermission(userId: number, organizationId: number): Promise<boolean>;
}
