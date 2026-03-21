import type {
  NewJobApplication,
  UpdateJobApplication,
} from "@/validations/job.validation";
import type {
  ApplicationsByJobInterface,
  ApplicationsByUserInterface,
  JobApplication,
  JobApplicationWithNotes,
} from "@/validations/jobApplications.validation";
import type {
  OrganizationJobApplicationsResponse,
  NewJobApplicationNote,
  JobApplicationsForOrganizationInterface,
  ApplicationsForOrganizationInterface,
} from "@/validations/organization.validation";

export interface ApplicationsRepositoryPort {
  createApplication(
    applicationData: NewJobApplication,
  ): Promise<number | undefined>;

  findApplicationsByJob(
    jobId: number,
    options?: { page?: number; limit?: number; status?: string },
  ): Promise<ApplicationsByJobInterface>;

  findApplicationsByUser(
    userId: number,
    appliedJobIds?: number[],
    options?: {
      page?: number;
      limit?: number;
      status?:
        | "pending"
        | "reviewed"
        | "shortlisted"
        | "interviewing"
        | "rejected"
        | "hired"
        | "withdrawn";
    },
  ): Promise<ApplicationsByUserInterface>;

  updateApplicationStatus(
    applicationId: number,
    updateData: UpdateJobApplication,
  ): Promise<boolean>;

  findApplicationById(applicationId: number): Promise<JobApplication | null>;

  hasUserAppliedToJob(userId: number, jobId: number): Promise<boolean>;

  deleteJobApplicationsByUserId(userId: number): Promise<void>;

  // ─── Employer/Organization-scoped application methods ─────────────

  getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<OrganizationJobApplicationsResponse>;

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
  ): Promise<OrganizationJobApplicationsResponse>;

  createJobApplicationNote(
    data: NewJobApplicationNote,
  ): Promise<JobApplicationWithNotes>;

  getNotesForJobApplication(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<{ note: string; createdAt: Date }[]>;

  getJobApplicationsForOrganization(
    organizationId: number,
    jobId: number,
  ): Promise<JobApplicationsForOrganizationInterface[]>;

  getApplicationsForOrganization(
    organizationId: number,
    options: { page?: number; limit?: number },
  ): Promise<ApplicationsForOrganizationInterface>;
}
