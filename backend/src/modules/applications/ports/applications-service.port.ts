import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type {
  NewJobApplication,
  UpdateJobApplication,
} from "@/validations/job.validation";
import type {
  ApplicationQueryParams,
  ApplicationsByJobInterface,
  ApplicationsByUserInterface,
  JobApplicationWithNotes,
} from "@/validations/jobApplications.validation";
import type {
  OrganizationJobApplicationsResponse,
  CreateJobApplicationNoteInputSchema,
  JobApplicationsForOrganizationInterface,
  ApplicationsForOrganizationInterface,
} from "@/validations/organization.validation";

export interface ApplicationsServicePort {
  applyForJob(
    applicationData: NewJobApplication & {
      resume?: Express.Multer.File;
      coverLetterFile?: Express.Multer.File;
    },
    correlationId: string,
  ): Promise<Result<{ applicationId: number; message: string }, Error>>;

  getJobApplications(
    jobId: number,
    query: ApplicationQueryParams,
    requesterId: number,
  ): Promise<Result<ApplicationsByJobInterface, Error>>;

  getUserApplications(
    userId: number,
    query: ApplicationQueryParams,
  ): Promise<Result<ApplicationsByUserInterface, Error>>;

  updateApplicationStatus(
    applicationId: number,
    data: UpdateJobApplication,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>>;

  withdrawApplication(
    applicationId: number,
    userId: number,
  ): Promise<Result<{ message: string }, Error>>;

  deleteJobApplicationsByUserId(userId: number): Promise<Result<null, Error>>;

  // ─── Employer/Organization-scoped application methods ─────────────

  getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<Result<OrganizationJobApplicationsResponse, AppError>>;

  updateOrgJobApplicationStatus(
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
}
