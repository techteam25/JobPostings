import type { BaseRepositoryPort } from "./base-repository.port";
import type { organizations } from "@/db/schema";
import type {
  NewOrganization,
  NewJobApplicationNote,
} from "@/validations/organization.validation";
import type { OrganizationRepository } from "@/repositories/organization.repository";

type OrganizationSelect = typeof organizations.$inferSelect;
type OrganizationInsert = typeof organizations.$inferInsert;

export interface OrganizationRepositoryPort
  extends BaseRepositoryPort<OrganizationSelect, OrganizationInsert> {
  /**
   * Finds an organization by its name.
   */
  findByName(
    name: string,
  ): Promise<
    Awaited<
      ReturnType<InstanceType<typeof OrganizationRepository>["findByName"]>
    >
  >;

  /**
   * Finds an organization by its ID, including members with user details.
   */
  findByIdIncludingMembers(
    organizationId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["findByIdIncludingMembers"]
      >
    >
  >;

  /**
   * Searches organizations by name, city, or state with pagination.
   */
  searchOrganizations(
    searchTerm: string,
    options?: { page?: number; limit?: number },
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["searchOrganizations"]
      >
    >
  >;

  /**
   * Creates a new organization and adds the creator as the owner.
   */
  createOrganization(
    data: NewOrganization,
    sessionUserId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["createOrganization"]
      >
    >
  >;

  /**
   * Finds an organization member by contact (user) ID.
   */
  findByContact(
    contactId: number,
    organizationId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["findByContact"]
      >
    >
  >;

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
  getUserOrganizations(
    userId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["getUserOrganizations"]
      >
    >
  >;

  /**
   * Retrieves organization members by their role.
   */
  getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<
          typeof OrganizationRepository
        >["getOrganizationMembersByRole"]
      >
    >
  >;

  /**
   * Retrieves a specific job application for an organization.
   */
  getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<
          typeof OrganizationRepository
        >["getJobApplicationForOrganization"]
      >
    >
  >;

  /**
   * Updates the status of a job application.
   */
  updateJobApplicationStatus(
    organizationId: number,
    jobId: number,
    applicationId: number,
    status:
      | "pending"
      | "reviewed"
      | "shortlisted"
      | "interviewing"
      | "rejected"
      | "hired"
      | "withdrawn",
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<
          typeof OrganizationRepository
        >["updateJobApplicationStatus"]
      >
    >
  >;

  /**
   * Creates a note for a job application.
   */
  createJobApplicationNote(
    data: NewJobApplicationNote,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<
          typeof OrganizationRepository
        >["createJobApplicationNote"]
      >
    >
  >;

  /**
   * Retrieves notes for a specific job application.
   */
  getNotesForJobApplication(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<
          typeof OrganizationRepository
        >["getNotesForJobApplication"]
      >
    >
  >;

  /**
   * Retrieves job applications for a specific job in an organization.
   */
  getJobApplicationsForOrganization(
    organizationId: number,
    jobId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<
          typeof OrganizationRepository
        >["getJobApplicationsForOrganization"]
      >
    >
  >;

  /**
   * Retrieves all applications for an organization with pagination.
   */
  getApplicationsForOrganization(
    organizationId: number,
    options: { page?: number; limit?: number },
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<
          typeof OrganizationRepository
        >["getApplicationsForOrganization"]
      >
    >
  >;

  /**
   * Finds an organization member by user ID.
   */
  findMemberByUserId(
    userId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["findMemberByUserId"]
      >
    >
  >;

  /**
   * Validates if an organization exists.
   */
  validateOrganizationExists(orgId: number): Promise<boolean>;

  /**
   * Checks if a user has delete permission for an organization.
   */
  hasDeletePermission(userId: number, orgId: number): Promise<boolean>;

  /**
   * Finds an invitation by token.
   */
  findInvitationByToken(
    token: string,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["findInvitationByToken"]
      >
    >
  >;

  /**
   * Finds an invitation by email and organization ID.
   */
  findInvitationByEmailAndOrg(
    email: string,
    organizationId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<
          typeof OrganizationRepository
        >["findInvitationByEmailAndOrg"]
      >
    >
  >;

  /**
   * Creates a new invitation.
   */
  createInvitation(data: {
    organizationId: number;
    email: string;
    role: "owner" | "admin" | "recruiter" | "member";
    token: string;
    invitedBy: number;
    expiresAt: Date;
  }): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["createInvitation"]
      >
    >
  >;

  /**
   * Updates an invitation (for resend/reactivation).
   */
  updateInvitation(
    invitationId: number,
    data: {
      token: string;
      expiresAt: Date;
      status?: "pending" | "accepted" | "expired" | "cancelled";
    },
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["updateInvitation"]
      >
    >
  >;

  /**
   * Updates invitation status.
   */
  updateInvitationStatus(
    invitationId: number,
    data: {
      status: "accepted" | "cancelled" | "expired";
      acceptedAt?: Date;
      cancelledAt?: Date;
      cancelledBy?: number;
      expiredAt?: Date;
    },
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<
          typeof OrganizationRepository
        >["updateInvitationStatus"]
      >
    >
  >;

  /**
   * Finds an invitation by ID.
   */
  findInvitationById(
    invitationId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["findInvitationById"]
      >
    >
  >;

  /**
   * Checks if an email is already an active member of an organization.
   */
  isEmailActiveMember(
    email: string,
    organizationId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["isEmailActiveMember"]
      >
    >
  >;

  /**
   * Creates an organization member record.
   */
  createMember(data: {
    userId: number;
    organizationId: number;
    role: "owner" | "admin" | "recruiter" | "member";
  }): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof OrganizationRepository>["createMember"]
      >
    >
  >;
}
