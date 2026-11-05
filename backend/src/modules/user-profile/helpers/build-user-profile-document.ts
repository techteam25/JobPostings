import type { JobPreference, WorkArea } from "@/modules/user-profile";
import type { UserProfileDocument } from "@shared/ports/typesense-user-profile-service.port";

export function buildUserProfileDocument(
  userId: number,
  preference: JobPreference,
  workAreas: WorkArea[],
): UserProfileDocument {
  return {
    id: String(userId),
    userId,
    jobTypes: preference.jobTypes ?? [],
    compensationTypes: preference.compensationTypes ?? [],
    workScheduleDays: preference.workScheduleDays ?? [],
    scheduleTypes: preference.scheduleTypes ?? [],
    workArrangements: preference.workArrangements ?? [],
    commuteTime: preference.commuteTime ?? null,
    willingnessToRelocate: preference.willingnessToRelocate ?? null,
    volunteerHoursPerWeek: preference.volunteerHoursPerWeek ?? null,
    workAreas: workAreas.map((wa) => wa.name),
    updatedAt: Date.now(),
  };
}
