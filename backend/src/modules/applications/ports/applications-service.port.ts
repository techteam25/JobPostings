import type { Result } from "@shared/result";
import type {
  NewJobApplication,
  UpdateJobApplication,
} from "@/validations/job.validation";
import type {
  ApplicationQueryParams,
  ApplicationsByJobInterface,
  ApplicationsByUserInterface,
} from "@/validations/jobApplications.validation";

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
}
