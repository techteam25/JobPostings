import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { PreferenceServicePort } from "@/modules/user-profile";
import type { PreferenceRepositoryPort } from "@/modules/user-profile";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import type { WorkAreaQueryPort } from "@/modules/user-profile";
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@shared/errors";
import { JobType } from "../constants/job-preference.constants";
import type { PatchJobPreferenceBody } from "@/validations/jobPreference.validation";

export class PreferenceService
  extends BaseService
  implements PreferenceServicePort
{
  constructor(
    private preferenceRepository: PreferenceRepositoryPort,
    private profileRepository: Pick<
      ProfileRepositoryPort,
      "findByIdWithProfile"
    >,
    private workAreaQuery: WorkAreaQueryPort,
  ) {
    super();
  }

  async getJobPreferences(userId: number) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user?.profile) {
        return fail(new NotFoundError("UserProfile", userId));
      }

      const preference = await this.preferenceRepository.getPreferences(
        user.profile.id,
      );

      if (!preference) {
        return ok(null);
      }

      const workAreas = await this.workAreaQuery.getSelectedWorkAreas(
        preference.id,
      );

      return ok({ ...preference, workAreas });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve job preferences"));
    }
  }

  async updateJobPreferences(userId: number, data: PatchJobPreferenceBody) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user?.profile) {
        return fail(new NotFoundError("UserProfile", userId));
      }

      // Merge partial update with existing preferences
      const existing = await this.preferenceRepository.getPreferences(
        user.profile.id,
      );

      const mergedJobTypes = data.jobTypes ?? existing?.jobTypes ?? [];
      const mergedCompensationTypes =
        data.compensationTypes ?? existing?.compensationTypes ?? [];
      const mergedWorkScheduleDays =
        data.workScheduleDays ?? existing?.workScheduleDays ?? [];
      const mergedScheduleTypes =
        data.scheduleTypes ?? existing?.scheduleTypes ?? [];
      const mergedWorkArrangements =
        data.workArrangements ?? existing?.workArrangements ?? [];
      const mergedCommuteTime =
        data.commuteTime ?? existing?.commuteTime ?? null;
      const mergedWillingnessToRelocate =
        data.willingnessToRelocate ?? existing?.willingnessToRelocate ?? null;

      const includesVolunteer = mergedJobTypes.includes(JobType.Volunteer);
      const volunteerHours =
        data.volunteerHoursPerWeek ?? existing?.volunteerHoursPerWeek;

      // Business rule: volunteer hours required when volunteer job type selected
      if (includesVolunteer && !volunteerHours) {
        return fail(
          new ValidationError(
            "volunteerHoursPerWeek is required when job types include volunteer",
          ),
        );
      }

      // Clear volunteer hours when volunteer type is removed
      const sanitizedData = {
        jobTypes: mergedJobTypes,
        compensationTypes: mergedCompensationTypes,
        volunteerHoursPerWeek: includesVolunteer ? volunteerHours : null,
        workScheduleDays: mergedWorkScheduleDays,
        scheduleTypes: mergedScheduleTypes,
        workArrangements: mergedWorkArrangements,
        commuteTime: mergedCommuteTime,
        willingnessToRelocate: mergedWillingnessToRelocate,
      };

      const result = await this.preferenceRepository.upsertPreferences(
        user.profile.id,
        sanitizedData,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update job preferences"));
    }
  }
}
