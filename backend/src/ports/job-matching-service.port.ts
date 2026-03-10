import type { Result } from "@/services/base.service";
import type { DatabaseError } from "@/utils/errors";
import type { Job } from "@/validations/job.validation";
import type { JobAlert } from "@/validations/jobAlerts.validation";

/**
 * Port interface for JobMatchingService.
 * Defines the public contract for job alert matching operations.
 */
export interface JobMatchingServicePort {
  findMatchingJobsForAlert(
    alert: JobAlert,
    limit?: number,
  ): Promise<
    Result<Array<{ job: Partial<Job>; matchScore: number }>, DatabaseError>
  >;
}
