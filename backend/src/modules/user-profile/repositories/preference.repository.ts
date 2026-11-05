import { eq, sql } from "drizzle-orm";
import { jobPreferences } from "@/db/schema";
import { BaseRepository } from "@shared/base/base.repository";
import { db } from "@shared/db/connection";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import { DatabaseError } from "@shared/errors";
import type {
  JobPreference,
  PreferenceRepositoryPort,
} from "@/modules/user-profile";

export class PreferenceRepository
  extends BaseRepository<typeof jobPreferences>
  implements PreferenceRepositoryPort
{
  constructor() {
    super(jobPreferences, "JobPreference");
  }

  async getPreferences(
    userProfileId: number,
  ): Promise<JobPreference | undefined> {
    return await withDbErrorHandling(async () => {
      const rows = await db
        .select()
        .from(jobPreferences)
        .where(eq(jobPreferences.userProfileId, userProfileId));

      return rows[0];
    });
  }

  async upsertPreferences(
    userProfileId: number,
    data: {
      jobTypes: JobPreference["jobTypes"];
      compensationTypes: JobPreference["compensationTypes"];
      volunteerHoursPerWeek?: JobPreference["volunteerHoursPerWeek"];
      workScheduleDays?: JobPreference["workScheduleDays"];
      scheduleTypes?: JobPreference["scheduleTypes"];
      workArrangements?: JobPreference["workArrangements"];
      commuteTime?: JobPreference["commuteTime"];
      willingnessToRelocate?: JobPreference["willingnessToRelocate"];
    },
  ): Promise<JobPreference> {
    return await withDbErrorHandling(async () => {
      await db
        .insert(jobPreferences)
        .values({
          userProfileId,
          jobTypes: data.jobTypes,
          compensationTypes: data.compensationTypes,
          volunteerHoursPerWeek: data.volunteerHoursPerWeek ?? null,
          workScheduleDays: data.workScheduleDays ?? null,
          scheduleTypes: data.scheduleTypes ?? null,
          workArrangements: data.workArrangements ?? null,
          commuteTime: data.commuteTime ?? null,
          willingnessToRelocate: data.willingnessToRelocate ?? null,
        })
        .onDuplicateKeyUpdate({
          set: {
            jobTypes: sql`values(${jobPreferences.jobTypes})`,
            compensationTypes: sql`values(${jobPreferences.compensationTypes})`,
            volunteerHoursPerWeek: sql`values(${jobPreferences.volunteerHoursPerWeek})`,
            workScheduleDays: sql`values(${jobPreferences.workScheduleDays})`,
            scheduleTypes: sql`values(${jobPreferences.scheduleTypes})`,
            workArrangements: sql`values(${jobPreferences.workArrangements})`,
            commuteTime: sql`values(${jobPreferences.commuteTime})`,
            willingnessToRelocate: sql`values(${jobPreferences.willingnessToRelocate})`,
          },
        });

      // Select back the upserted row
      const rows = await db
        .select()
        .from(jobPreferences)
        .where(eq(jobPreferences.userProfileId, userProfileId));

      if (!rows[0]) {
        throw new DatabaseError("Failed to upsert job preferences");
      }

      return rows[0];
    });
  }
}
