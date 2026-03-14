import type { BaseRepositoryPort } from "@/ports/base-repository.port";
import type { organizations } from "@/db/schema";
import type {
  NewOrganization,
  Organization,
  OrganizationWithMembersInterface,
  OrganizationSearchResultInterface,
  OrganizationMemberInterface,
  UserOrganizationInterface,
  OrganizationWithMembers,
  OrganizationMember,
} from "@/validations/organization.validation";

type OrganizationSelect = typeof organizations.$inferSelect;
type OrganizationInsert = typeof organizations.$inferInsert;

/**
 * Port interface for OrganizationsRepository.
 * Defines the contract for organization CRUD and membership operations.
 * Does NOT include invitation or employer-facing application methods
 * (those belong to their respective modules).
 */
export interface OrganizationsRepositoryPort
  extends BaseRepositoryPort<OrganizationSelect, OrganizationInsert> {
  /**
   * Finds an organization by its name.
   */
  findByName(name: string): Promise<Organization | undefined>;

  /**
   * Finds an organization by its ID, including members with user details.
   */
  findByIdIncludingMembers(
    organizationId: number,
  ): Promise<OrganizationWithMembersInterface>;

  /**
   * Searches organizations by name, city, or state with pagination.
   */
  searchOrganizations(
    searchTerm: string,
    options?: { page?: number; limit?: number },
  ): Promise<OrganizationSearchResultInterface>;

  /**
   * Creates a new organization and adds the creator as the owner.
   */
  createOrganization(
    data: NewOrganization,
    sessionUserId: number,
  ): Promise<OrganizationWithMembersInterface>;

  /**
   * Finds an organization member by contact (user) ID.
   */
  findByContact(
    contactId: number,
    organizationId: number,
  ): Promise<OrganizationMemberInterface>;

  /**
   * Checks if a user can post jobs based on their organization memberships.
   */
  canPostJobs(userId: number): Promise<boolean>;

  /**
   * Checks if a user can reject job applications for a specific organization.
   */
  canRejectJobApplications(
    userId: number,
    organizationId: number,
  ): Promise<boolean>;

  /**
   * Checks if a user has any of the specified elevated roles in an organization.
   */
  checkHasElevatedRole(
    userId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ): Promise<boolean>;

  /**
   * Retrieves all active organizations for a user.
   */
  getUserOrganizations(userId: number): Promise<UserOrganizationInterface[]>;

  /**
   * Retrieves organization members by their role.
   */
  getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ): Promise<OrganizationWithMembers>;

  /**
   * Finds an organization member by user ID.
   */
  findMemberByUserId(userId: number): Promise<OrganizationMember | null>;

  /**
   * Validates if an organization exists.
   */
  validateOrganizationExists(orgId: number): Promise<boolean>;

  /**
   * Checks if a user has delete permission for an organization.
   */
  hasDeletePermission(userId: number, orgId: number): Promise<boolean>;

  /**
   * Creates an organization member record.
   * Used by the invitations module (via OrgMembershipCommandPort adapter)
   * when accepting invitations.
   */
  createMember(data: {
    userId: number;
    organizationId: number;
    role: "owner" | "admin" | "recruiter" | "member";
  }): Promise<OrganizationMember | undefined>;
}
