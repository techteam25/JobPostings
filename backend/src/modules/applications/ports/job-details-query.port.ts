// Internal DTOs — NOT exported from barrel file.
// Consumers infer these types from the port's method signatures.

interface JobForApplication {
  id: number;
  title: string;
  isActive: boolean;
  applicationDeadline: Date | null;
  employerId: number;
}

interface JobWithEmployerId {
  jobId: number;
  employerId: number;
  employerOrgId: number;
}

/**
 * Port for querying job details from the applications module's perspective.
 * The applications module needs job data for validation (is job active?),
 * authorization (who owns the job?), and display (job title in emails).
 *
 * Implemented by an adapter in src/shared/adapters/.
 */
export interface JobDetailsQueryPort {
  getJobForApplication(jobId: number): Promise<JobForApplication | null>;
  getJobWithEmployerId(jobId: number): Promise<JobWithEmployerId | null>;
  doesJobExist(jobId: number): Promise<boolean>;
}
