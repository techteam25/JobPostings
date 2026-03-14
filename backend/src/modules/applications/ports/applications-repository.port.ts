import type {
  NewJobApplication,
  UpdateJobApplication,
} from "@/validations/job.validation";
import type {
  ApplicationsByJobInterface,
  ApplicationsByUserInterface,
  JobApplication,
} from "@/validations/jobApplications.validation";

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
}
