import { BaseRepository } from "./base.repository";
import { jobInsights, UpdateJobInsights } from "../db/schema";
import { db } from "../db/connection";
import { eq, sql } from "drizzle-orm";

export class JobInsightsRepository extends BaseRepository<typeof jobInsights> {
  constructor() {
    super(jobInsights);
  }
  async getJobInsights() {}

  async incrementJobViews(jobId: number) {
    const result = await db.update(jobInsights).set({
      viewCount: sql`(${jobInsights.viewCount} + 1)`,
    });
  }
  async incrementJobApplications(jobId: number) {
    const result = await db.update(jobInsights).set({
      viewCount: sql`(${jobInsights.applicationCount} + 1)`,
    });
  }

  async getJobInsightByOrganizationId(organizationId: number) {
    const [result] = await db
      .select()
      .from(jobInsights)
      .where(eq(jobInsights.organization, organizationId));
    return result;
  }

  async getJobInsightByJobId(jobId: number) {
    const [result] = await db
      .select()
      .from(jobInsights)
      .where(eq(jobInsights.job, jobId));
    return result;
  }
}
