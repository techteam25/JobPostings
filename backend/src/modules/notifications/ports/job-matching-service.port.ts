import type { Result } from "@shared/result";
import type { DatabaseError } from "@shared/errors";
import type { Job } from "@/validations/job.validation";
import type { JobAlert } from "@/validations/jobAlerts.validation";

export interface JobMatchingServicePort {
  findMatchingJobsForAlert(
    alert: JobAlert,
    limit?: number,
  ): Promise<
    Result<Array<{ job: Partial<Job>; matchScore: number }>, DatabaseError>
  >;
}
