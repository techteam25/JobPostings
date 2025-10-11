import { BaseRepository } from "./base.repository";
import { jobInsights } from "@/db/schema";
import { db } from "@/db/connection";
import { eq, sql } from "drizzle-orm";
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
    const [result] = await withDbErrorHandling(
      async () =>
        await db
          .select()
          .from(jobInsights)
          .where(eq(jobInsights.organization, organizationId)),
    );
    return result;
  }

  async getJobInsightByJobId(jobId: number) {
    const [result] = await withDbErrorHandling(
      async () =>
        await db.select().from(jobInsights).where(eq(jobInsights.job, jobId)),
    );
    return result;
  }
}
