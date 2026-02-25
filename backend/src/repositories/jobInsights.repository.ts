import { BaseRepository } from "./base.repository";
import { jobInsights, jobsDetails } from "@/db/schema";
import { db } from "@/db/connection";
import { and, count, eq, sql, sum } from "drizzle-orm";
import { withDbErrorHandling } from "@/db/dbErrorHandler";

/**
 * Repository class for managing job insights data, including views and applications.
 */
export class JobInsightsRepository extends BaseRepository<typeof jobInsights> {
  /**
   * Creates an instance of JobInsightsRepository.
   */
  constructor() {
    super(jobInsights);
  }

  /**
   * Placeholder method for getting job insights.
   */
  async getJobInsights() {}

  /**
   * Increments the view count for a specific job.
   * @param jobId The ID of the job.
   */
  async incrementJobViews(jobId: number) {
    await withDbErrorHandling(
      async () =>
        await db
          .update(jobInsights)
          .set({
            viewCount: sql`(${jobInsights.viewCount} + 1)`,
          })
          .where(eq(jobInsights.job, jobId)),
    );
  }

  /**
   * Increments the application count for a specific job.
   * @param jobId The ID of the job.
   */
  async incrementJobApplications(jobId: number) {
    await withDbErrorHandling(
      async () =>
        await db
          .update(jobInsights)
          .set({
            applicationCount: sql`(${jobInsights.applicationCount} + 1)`,
          })
          .where(eq(jobInsights.job, jobId)),
    );
  }

  /**
   * Retrieves job insights aggregated by organization ID.
   * @param organizationId The ID of the organization.
   * @returns An object containing total jobs, active jobs, inactive jobs, total views, and total applications.
   */
  async getJobInsightByOrganizationId(organizationId: number) {
    return await withDbErrorHandling(async () => {
      return await db.transaction(async (transaction) => {
        const [total] = await transaction
          .select({
            total: count(),
          })
          .from(jobInsights)
          .where(eq(jobInsights.organization, organizationId));

        const [active] = await transaction
          .select({
            active: count(),
          })
          .from(jobInsights)
          .where(eq(jobInsights.organization, organizationId));

        const [inactive] = await transaction
          .select({
            inactive: count(),
          })
          .from(jobInsights)
          .innerJoin(jobsDetails, eq(jobsDetails.employerId, organizationId))
          .where(
            and(
              eq(jobInsights.organization, organizationId),
              eq(jobsDetails.isActive, false),
            ),
          );

        const [totalViews] = await transaction
          .select({
            totalViews: sum(jobInsights.viewCount).mapWith(Number),
          })
          .from(jobInsights)
          .where(eq(jobInsights.organization, organizationId))
          .groupBy(jobInsights.organization);

        const [totalApplications] = await transaction
          .select({
            totalApplications: sum(jobInsights.applicationCount).mapWith(
              Number,
            ),
          })
          .from(jobInsights)
          .where(eq(jobInsights.organization, organizationId))
          .groupBy(jobInsights.organization);

        return {
          total: total?.total || 0,
          active: active?.active || 0,
          inactive: inactive?.inactive || 0,
          totalApplications: totalApplications?.totalApplications || 0,
          totalViews: totalViews?.totalViews || 0,
        };
      });
    });
  }

  /**
   * Retrieves job insights for a specific job by its ID.
   * @param jobId The ID of the job.
   * @returns The job insights data.
   */
  async getJobInsightByJobId(jobId: number) {
    const [result] = await withDbErrorHandling(
      async () =>
        await db.select().from(jobInsights).where(eq(jobInsights.job, jobId)),
    );
    return result;
  }
}
