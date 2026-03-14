import { Result } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import { OrganizationsService } from "@/modules/organizations/services/organizations.service";
import { OrganizationsRepository } from "@/modules/organizations/repositories/organizations.repository";
import { InvitationsService } from "@/modules/invitations/services/invitations.service";
import { InvitationsRepository } from "@/modules/invitations/repositories/invitations.repository";
import { ApplicationsService } from "@/modules/applications/services/applications.service";
import { ApplicationsRepository } from "@/modules/applications/repositories/applications.repository";
import { IdentityRepository } from "@/modules/identity/repositories/identity.repository";
import { OrganizationsToInvitationsAdapter } from "@shared/adapters/organizations-to-invitations.adapter";
import { IdentityToInvitationsAdapter } from "@shared/adapters/identity-to-invitations.adapter";
import { JobBoardToApplicationsAdapter } from "@shared/adapters/job-board-to-applications.adapter";
import { JobBoardRepository } from "@/modules/job-board/repositories/job-board.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { UserRepository } from "@/repositories/user.repository";
import { EmailService } from "@shared/infrastructure/email.service";
import { BullMqEventBus } from "@shared/events";
import type { OrganizationServicePort } from "@/ports/organization-service.port";
import type {
  CreateJobApplicationNoteInputSchema,
  NewOrganization,
  OrganizationJobApplicationsResponse,
} from "@/validations/organization.validation";
import type { AppError } from "@shared/errors";
import type { JobApplicationWithNotes } from "@/validations/jobApplications.validation";

/**
 * Facade service that delegates to module-specific services.
 * Maintains backward compatibility with OrganizationServicePort while the codebase
 * is incrementally migrated to use module services directly.
 *
 * @deprecated Consumers should migrate to module-specific services:
 *   - OrganizationsService for org CRUD and membership operations
 *   - InvitationsService for invitation operations
 *   - ApplicationsService for employer-scoped application management
 */
export class OrganizationService
  extends BaseService
  implements OrganizationServicePort
{
  private organizationsService: OrganizationsService;
  private invitationsService: InvitationsService;
  private applicationsService: ApplicationsService;

  constructor() {
    super();

    // Organizations module
    const organizationsRepository = new OrganizationsRepository();
    this.organizationsService = new OrganizationsService(
      organizationsRepository,
    );

    // Invitations module (with cross-module adapters)
    const invitationsRepository = new InvitationsRepository();
    const orgMembershipAdapter = new OrganizationsToInvitationsAdapter(
      organizationsRepository,
    );
    const identityRepository = new IdentityRepository();
    const userEmailQueryAdapter = new IdentityToInvitationsAdapter(
      identityRepository,
    );
    const emailService = new EmailService();
    this.invitationsService = new InvitationsService(
      invitationsRepository,
      orgMembershipAdapter,
      userEmailQueryAdapter,
      emailService,
    );

    // Applications module (for employer-scoped methods)
    // Uses the old OrganizationRepository facade since ApplicationsService
    // expects OrganizationRepositoryPort (the old monolith port)
    const applicationsRepository = new ApplicationsRepository();
    const jobBoardRepository = new JobBoardRepository();
    const jobDetailsAdapter = new JobBoardToApplicationsAdapter(
      jobBoardRepository,
    );
    const orgRepoFacade = new OrganizationRepository();
    const userRepository = new UserRepository();
    this.applicationsService = new ApplicationsService(
      applicationsRepository,
      jobDetailsAdapter,
      orgRepoFacade,
      userRepository,
      new BullMqEventBus(),
    );
  }

  // ─── Organization CRUD (delegate to OrganizationsService) ─────────

  async getAllOrganizations(
    options: { page?: number; limit?: number; searchTerm?: string } = {},
  ) {
    return this.organizationsService.getAllOrganizations(options);
  }

  async getOrganizationById(id: number) {
    return this.organizationsService.getOrganizationById(id);
  }

  async createOrganization(
    organizationData: NewOrganization,
    sessionUserId: number,
    correlationId: string,
  ) {
    return this.organizationsService.createOrganization(
      organizationData,
      sessionUserId,
      correlationId,
    );
  }

  async uploadOrganizationLogo(
    userId: number,
    organizationId: number,
    logoFile: Express.Multer.File,
    correlationId: string,
  ) {
    return this.organizationsService.uploadOrganizationLogo(
      userId,
      organizationId,
      logoFile,
      correlationId,
    );
  }

  async updateOrganization(id: number, updateData: Partial<NewOrganization>) {
    return this.organizationsService.updateOrganization(id, updateData);
  }

  async deleteOrganization(id: number) {
    return this.organizationsService.deleteOrganization(id);
  }

  async isRolePermitted(userId: number) {
    return this.organizationsService.isRolePermitted(userId);
  }

  async isRolePermittedToRejectApplications(
    userId: number,
    organizationId: number,
  ) {
    return this.organizationsService.isRolePermittedToRejectApplications(
      userId,
      organizationId,
    );
  }

  async getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ) {
    return this.organizationsService.getOrganizationMembersByRole(
      organizationId,
      role,
    );
  }

  async getOrganizationMember(sessionUserId: number, organizationId: number) {
    return this.organizationsService.getOrganizationMember(
      sessionUserId,
      organizationId,
    );
  }

  async getFirstOrganizationForUser(userId: number) {
    return this.organizationsService.getFirstOrganizationForUser(userId);
  }

  async getUserOrganizations(userId: number) {
    return this.organizationsService.getUserOrganizations(userId);
  }

  async hasDeletePermission(
    userId: number,
    organizationId: number,
  ): Promise<boolean> {
    return this.organizationsService.hasDeletePermission(
      userId,
      organizationId,
    );
  }

  // ─── Employer Application Methods (delegate to ApplicationsService) ──

  async getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<Result<OrganizationJobApplicationsResponse, AppError>> {
    return this.applicationsService.getJobApplicationForOrganization(
      organizationId,
      jobId,
      applicationId,
    );
  }

  async updateJobApplicationStatus(
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
    return this.applicationsService.updateOrgJobApplicationStatus(
      organizationId,
      jobId,
      applicationId,
      status,
    );
  }

  async createJobApplicationNote(
    applicationId: number,
    userId: number,
    body: CreateJobApplicationNoteInputSchema["body"],
  ): Promise<Result<JobApplicationWithNotes, Error>> {
    return this.applicationsService.createJobApplicationNote(
      applicationId,
      userId,
      body,
    );
  }

  async getNotesForJobApplication(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ) {
    return this.applicationsService.getNotesForJobApplication(
      organizationId,
      jobId,
      applicationId,
    );
  }

  async getJobApplicationsForOrganization(
    organizationId: number,
    jobId: number,
  ) {
    return this.applicationsService.getJobApplicationsForOrganization(
      organizationId,
      jobId,
    );
  }

  async getApplicationsForOrganization(
    organizationId: number,
    options: { page?: number; limit?: number },
  ) {
    return this.applicationsService.getApplicationsForOrganization(
      organizationId,
      options,
    );
  }

  // ─── Invitation Methods (delegate to InvitationsService) ──────────

  async sendInvitation(
    organizationId: number,
    email: string,
    role: "owner" | "admin" | "recruiter" | "member",
    requesterId: number,
  ): Promise<Result<{ invitationId: number; message: string }, Error>> {
    return this.invitationsService.sendInvitation(
      organizationId,
      email,
      role,
      requesterId,
    );
  }

  async getInvitationDetails(token: string, organizationId: number) {
    return this.invitationsService.getInvitationDetails(
      token,
      organizationId,
    );
  }

  async acceptInvitation(
    token: string,
    userId: number,
    organizationId: number,
  ): Promise<Result<{ message: string }, Error>> {
    return this.invitationsService.acceptInvitation(
      token,
      userId,
      organizationId,
    );
  }

  async cancelInvitation(
    organizationId: number,
    invitationId: number,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>> {
    return this.invitationsService.cancelInvitation(
      organizationId,
      invitationId,
      requesterId,
    );
  }
}
