import { BaseRepository } from "./base.repository";
import { jobInsights, jobsDetails } from "@/db/schema";
import { db } from "@/db/connection";
import { and, count, eq, sql, sum } from "drizzle-orm";
import { withDbErrorHandling } from "@/db/dbErrorHandler";

export class JobInsightsRepository extends BaseRepository<typeof jobInsights> {
  constructor() {
    super(jobInsights);
  }
  async getJobInsights() {}

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
  async incrementJobApplications(jobId: number) {
    await withDbErrorHandling(
      async () =>
        await db
          .update(jobInsights)
          .set({
            viewCount: sql`(${jobInsights.applicationCount} + 1)`,
          })
          .where(eq(jobInsights.job, jobId)),
    );
  }

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

  async getJobInsightByJobId(jobId: number) {
    const [result] = await withDbErrorHandling(
      async () =>
        await db.select().from(jobInsights).where(eq(jobInsights.job, jobId)),
    );
    return result;
  }
}
