import { organizations } from "@/db/schema";
import { BaseRepository } from "@shared/base/base.repository";
import { OrganizationsRepository } from "@/modules/organizations/repositories/organizations.repository";
import { InvitationsRepository } from "@/modules/invitations/repositories/invitations.repository";
import { ApplicationsRepository } from "@/modules/applications/repositories/applications.repository";
import type { OrganizationRepositoryPort } from "@/ports/organization-repository.port";
import type {
  NewOrganization,
  NewJobApplicationNote,
} from "@/validations/organization.validation";

/**
 * Facade repository that delegates to module-specific repositories.
 * Maintains backward compatibility with OrganizationRepositoryPort while the codebase
 * is incrementally migrated to use module repositories directly.
 *
 * @deprecated Consumers should migrate to module-specific repositories:
 *   - OrganizationsRepository for org CRUD and membership operations
 *   - InvitationsRepository for invitation DB operations
 *   - ApplicationsRepository for employer-scoped application queries
 */
export class OrganizationRepository
  extends BaseRepository<typeof organizations>
  implements OrganizationRepositoryPort
{
  private organizationsRepository: OrganizationsRepository;
  private invitationsRepository: InvitationsRepository;
  private applicationsRepository: ApplicationsRepository;

  constructor() {
    super(organizations);

    this.organizationsRepository = new OrganizationsRepository();
    this.invitationsRepository = new InvitationsRepository();
    this.applicationsRepository = new ApplicationsRepository();
  }

  // ─── Organization CRUD (delegate to OrganizationsRepository) ───────

  async findByName(name: string) {
    return this.organizationsRepository.findByName(name);
  }

  async findByIdIncludingMembers(organizationId: number) {
    return this.organizationsRepository.findByIdIncludingMembers(
      organizationId,
    );
  }

  async searchOrganizations(
    searchTerm: string,
    options?: { page?: number; limit?: number },
  ) {
    return this.organizationsRepository.searchOrganizations(
      searchTerm,
      options,
    );
  }

  async createOrganization(data: NewOrganization, sessionUserId: number) {
    return this.organizationsRepository.createOrganization(data, sessionUserId);
  }

  async findByContact(contactId: number, organizationId: number) {
    return this.organizationsRepository.findByContact(
      contactId,
      organizationId,
    );
  }

  async canPostJobs(userId: number): Promise<boolean> {
    return this.organizationsRepository.canPostJobs(userId);
  }

  async canRejectJobApplications(
    userId: number,
    organizationId: number,
  ): Promise<boolean> {
    return this.organizationsRepository.canRejectJobApplications(
      userId,
      organizationId,
    );
  }

  async checkHasElevatedRole(
    userId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ): Promise<boolean> {
    return this.organizationsRepository.checkHasElevatedRole(userId, roles);
  }

  async getUserOrganizations(userId: number) {
    return this.organizationsRepository.getUserOrganizations(userId);
  }

  async getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ) {
    return this.organizationsRepository.getOrganizationMembersByRole(
      organizationId,
      role,
    );
  }

  async findMemberByUserId(userId: number) {
    return this.organizationsRepository.findMemberByUserId(userId);
  }

  async validateOrganizationExists(orgId: number): Promise<boolean> {
    return this.organizationsRepository.validateOrganizationExists(orgId);
  }

  async hasDeletePermission(userId: number, orgId: number): Promise<boolean> {
    return this.organizationsRepository.hasDeletePermission(userId, orgId);
  }

  async createMember(data: {
    userId: number;
    organizationId: number;
    role: "owner" | "admin" | "recruiter" | "member";
  }) {
    return this.organizationsRepository.createMember(data);
  }

  // ─── Application Methods (delegate to ApplicationsRepository) ─────

  async getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ) {
    return this.applicationsRepository.getJobApplicationForOrganization(
      organizationId,
      jobId,
      applicationId,
    );
  }

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
  ) {
    return this.applicationsRepository.updateOrgJobApplicationStatus(
      organizationId,
      jobId,
      applicationId,
      status,
    );
  }

  createJobApplicationNote(data: NewJobApplicationNote) {
    return this.applicationsRepository.createJobApplicationNote(data);
  }

  getNotesForJobApplication(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ) {
    return this.applicationsRepository.getNotesForJobApplication(
      organizationId,
      jobId,
      applicationId,
    );
  }

  getJobApplicationsForOrganization(organizationId: number, jobId: number) {
    return this.applicationsRepository.getJobApplicationsForOrganization(
      organizationId,
      jobId,
    );
  }

  async getApplicationsForOrganization(
    organizationId: number,
    options: { page?: number; limit?: number },
  ) {
    return this.applicationsRepository.getApplicationsForOrganization(
      organizationId,
      options,
    );
  }

  // ─── Invitation Methods (delegate to InvitationsRepository) ────────

  async findInvitationByToken(token: string) {
    return this.invitationsRepository.findInvitationByToken(token);
  }

  async findInvitationByEmailAndOrg(email: string, organizationId: number) {
    return this.invitationsRepository.findInvitationByEmailAndOrg(
      email,
      organizationId,
    );
  }

  async createInvitation(data: {
    organizationId: number;
    email: string;
    role: "owner" | "admin" | "recruiter" | "member";
    token: string;
    invitedBy: number;
    expiresAt: Date;
  }) {
    return this.invitationsRepository.createInvitation(data);
  }

  async updateInvitation(
    invitationId: number,
    data: {
      token: string;
      expiresAt: Date;
      status?: "pending" | "accepted" | "expired" | "cancelled";
    },
  ) {
    return this.invitationsRepository.updateInvitation(invitationId, data);
  }

  async updateInvitationStatus(
    invitationId: number,
    data: {
      status: "accepted" | "cancelled" | "expired";
      acceptedAt?: Date;
      cancelledAt?: Date;
      cancelledBy?: number;
      expiredAt?: Date;
    },
  ) {
    return this.invitationsRepository.updateInvitationStatus(
      invitationId,
      data,
    );
  }

  async findInvitationById(invitationId: number) {
    return this.invitationsRepository.findInvitationById(invitationId);
  }

  async isEmailActiveMember(email: string, organizationId: number) {
    return this.invitationsRepository.isEmailActiveMember(
      email,
      organizationId,
    );
  }
}
