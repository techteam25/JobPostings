import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import {
  NewOrganization,
  OrganizationJobApplicationsResponse,
  CreateJobApplicationNoteInputSchema,
  OrganizationSearchResultInterface,
  OrganizationWithMembersInterface,
  OrganizationWithMembers,
  OrganizationMemberInterface,
  OrganizationMember,
  UserOrganizationInterface,
  JobApplicationsForOrganizationInterface,
  ApplicationsForOrganizationInterface,
} from "@/validations/organization.validation";
import { JobApplicationWithNotes } from "@/validations/jobApplications.validation";

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
  ): Promise<Result<OrganizationJobApplicationsResponse, Error>>;

  createJobApplicationNote(
    applicationId: number,
    userId: number,
    body: CreateJobApplicationNoteInputSchema["body"],
  ): Promise<Result<JobApplicationWithNotes, Error>>;

  getNotesForJobApplication(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<Result<{ note: string; createdAt: Date }[], Error>>;

  getJobApplicationsForOrganization(
    organizationId: number,
    jobId: number,
  ): Promise<Result<JobApplicationsForOrganizationInterface[], Error>>;

  getApplicationsForOrganization(
    organizationId: number,
    options: { page?: number; limit?: number },
  ): Promise<Result<ApplicationsForOrganizationInterface, Error>>;

  hasDeletePermission(userId: number, organizationId: number): Promise<boolean>;

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
