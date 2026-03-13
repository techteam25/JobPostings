import type { BaseRepositoryPort } from "./base-repository.port";
import type { jobInsights } from "@/db/schema";
import {
  JobInsight,
  OrganizationJobInsightInterface,
} from "@/validations/job.validation";

type JobInsightsSelect = typeof jobInsights.$inferSelect;
type JobInsightsInsert = typeof jobInsights.$inferInsert;

export interface JobInsightsRepositoryPort extends BaseRepositoryPort<
  JobInsightsSelect,
  JobInsightsInsert
> {
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
  ): Promise<OrganizationJobInsightInterface>;

  /**
   * Retrieves job insights for a specific job by its ID.
   */
  getJobInsightByJobId(jobId: number): Promise<JobInsight | undefined>;
}
