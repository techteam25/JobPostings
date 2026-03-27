import type { jobPreferences } from "@/db/schema";

export type JobPreference = typeof jobPreferences.$inferSelect;

export interface PreferenceRepositoryPort {
  getPreferences(userProfileId: number): Promise<JobPreference | undefined>;
  upsertPreferences(
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
  ): Promise<JobPreference>;
}
