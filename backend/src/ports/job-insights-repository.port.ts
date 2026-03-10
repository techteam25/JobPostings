import type { BaseRepositoryPort } from "./base-repository.port";
import type { jobInsights } from "@/db/schema";
import type { JobInsightsRepository } from "@/repositories/jobInsights.repository";

type JobInsightsSelect = typeof jobInsights.$inferSelect;
type JobInsightsInsert = typeof jobInsights.$inferInsert;

export interface JobInsightsRepositoryPort
  extends BaseRepositoryPort<JobInsightsSelect, JobInsightsInsert> {
  /**
   * Placeholder method for getting job insights.
   */
  getJobInsights(): Promise<void>;

  /**
   * Increments the view count for a specific job.
   */
  incrementJobViews(jobId: number): Promise<void>;

  /**
   * Increments the application count for a specific job.
   */
  incrementJobApplications(jobId: number): Promise<void>;

  /**
   * Retrieves job insights aggregated by organization ID.
   */
  getJobInsightByOrganizationId(
    organizationId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof JobInsightsRepository>["getJobInsightByOrganizationId"]
      >
    >
  >;

  /**
   * Retrieves job insights for a specific job by its ID.
   */
  getJobInsightByJobId(
    jobId: number,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof JobInsightsRepository>["getJobInsightByJobId"]
      >
    >
  >;
}
