import type { Result } from "@shared/result";
import type { OrganizationService } from "@/services/organization.service";
import type { AppError } from "@shared/errors";
import type {
  NewOrganization,
  OrganizationJobApplicationsResponse,
  CreateJobApplicationNoteInputSchema,
} from "@/validations/organization.validation";

/**
 * Type for invitation details response.
 * Mirrors the locally defined type in OrganizationService.
 */
export type OrganizationInvitationDetails = {
  organizationName: string;
  role: "owner" | "admin" | "recruiter" | "member";
  inviterName: string;
  expiresAt: Date;
};

/**
 * Port interface for OrganizationService.
 * Defines the public contract for organization-related operations.
 */
export interface OrganizationServicePort {
  getAllOrganizations(
    options?: { page?: number; limit?: number; searchTerm?: string },
  ): Promise<
    Awaited<ReturnType<OrganizationService["getAllOrganizations"]>>
  >;

  getOrganizationById(
    id: number,
  ): Promise<
    Awaited<ReturnType<OrganizationService["getOrganizationById"]>>
  >;

  createOrganization(
    organizationData: NewOrganization,
    sessionUserId: number,
    correlationId: string,
  ): Promise<
    Awaited<ReturnType<OrganizationService["createOrganization"]>>
  >;

  uploadOrganizationLogo(
    userId: number,
    organizationId: number,
    logoFile: Express.Multer.File,
    correlationId: string,
  ): Promise<
    Awaited<ReturnType<OrganizationService["uploadOrganizationLogo"]>>
  >;

  updateOrganization(
    id: number,
    updateData: Partial<NewOrganization>,
  ): Promise<
    Awaited<ReturnType<OrganizationService["updateOrganization"]>>
  >;

  deleteOrganization(
    id: number,
  ): Promise<
    Awaited<ReturnType<OrganizationService["deleteOrganization"]>>
  >;

  isRolePermitted(
    userId: number,
  ): Promise<
    Awaited<ReturnType<OrganizationService["isRolePermitted"]>>
  >;

  isRolePermittedToRejectApplications(
    userId: number,
    organizationId: number,
  ): Promise<
    Awaited<
      ReturnType<OrganizationService["isRolePermittedToRejectApplications"]>
    >
  >;

  getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ): Promise<
    Awaited<
      ReturnType<OrganizationService["getOrganizationMembersByRole"]>
    >
  >;

  getOrganizationMember(
    sessionUserId: number,
    organizationId: number,
  ): Promise<
    Awaited<ReturnType<OrganizationService["getOrganizationMember"]>>
  >;

  getFirstOrganizationForUser(
    userId: number,
  ): Promise<
    Awaited<
      ReturnType<OrganizationService["getFirstOrganizationForUser"]>
    >
  >;

  getUserOrganizations(
    userId: number,
  ): Promise<
    Awaited<ReturnType<OrganizationService["getUserOrganizations"]>>
  >;

  getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<Result<OrganizationJobApplicationsResponse, AppError>>;

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
      ReturnType<OrganizationService["updateJobApplicationStatus"]>
    >
  >;

  createJobApplicationNote(
    applicationId: number,
    userId: number,
    body: CreateJobApplicationNoteInputSchema["body"],
  ): Promise<
    Awaited<
      ReturnType<OrganizationService["createJobApplicationNote"]>
    >
  >;

  getNotesForJobApplication(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<
    Awaited<
      ReturnType<OrganizationService["getNotesForJobApplication"]>
    >
  >;

  getJobApplicationsForOrganization(
    organizationId: number,
    jobId: number,
  ): Promise<
    Awaited<
      ReturnType<
        OrganizationService["getJobApplicationsForOrganization"]
      >
    >
  >;

  getApplicationsForOrganization(
    organizationId: number,
    options: { page?: number; limit?: number },
  ): Promise<
    Awaited<
      ReturnType<OrganizationService["getApplicationsForOrganization"]>
    >
  >;

  hasDeletePermission(
    userId: number,
    organizationId: number,
  ): Promise<boolean>;

  sendInvitation(
    organizationId: number,
    email: string,
    role: "owner" | "admin" | "recruiter" | "member",
    requesterId: number,
  ): Promise<Result<{ invitationId: number; message: string }, Error>>;

  getInvitationDetails(
    token: string,
    organizationId: number,
  ): Promise<Result<OrganizationInvitationDetails, Error>>;

  acceptInvitation(
    token: string,
    userId: number,
    organizationId: number,
  ): Promise<Result<{ message: string }, Error>>;

  cancelInvitation(
    organizationId: number,
    invitationId: number,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>>;
}
