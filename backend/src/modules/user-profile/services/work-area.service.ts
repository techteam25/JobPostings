import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@shared/errors";
import type { WorkAreaServicePort } from "../ports/work-area-service.port";
import type { WorkAreaRepositoryPort } from "../ports/work-area-repository.port";
import type { PreferenceRepositoryPort } from "../ports/preference-repository.port";
import type { ProfileRepositoryPort } from "../ports/profile-repository.port";

export class WorkAreaService
  extends BaseService
  implements WorkAreaServicePort
{
  constructor(
    private workAreaRepository: WorkAreaRepositoryPort,
    private preferenceRepository: Pick<
      PreferenceRepositoryPort,
      "getPreferences"
    >,
    private profileRepository: Pick<
      ProfileRepositoryPort,
      "findByIdWithProfile"
    >,
  ) {
    super();
  }

  async getAllWorkAreas() {
    try {
      const workAreas = await this.workAreaRepository.getAllWorkAreas();
      return ok(workAreas);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve work areas"));
    }
  }

  async getSelectedWorkAreas(userId: number) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user?.profile) {
        return fail(new NotFoundError("UserProfile", userId));
      }

      const preference = await this.preferenceRepository.getPreferences(
        user.profile.id,
      );
      if (!preference) {
        return ok([]);
      }

      const workAreas = await this.workAreaRepository.getSelectedWorkAreas(
        preference.id,
      );
      return ok(workAreas);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve selected work areas"));
    }
  }

  async updateWorkAreas(userId: number, workAreaIds: number[]) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user?.profile) {
        return fail(new NotFoundError("UserProfile", userId));
      }

      const preference = await this.preferenceRepository.getPreferences(
        user.profile.id,
      );
      if (!preference) {
        return fail(
          new NotFoundError(
            "Job preferences must be created before selecting work areas",
          ),
        );
      }

      // Validate that all provided work area IDs exist
      if (workAreaIds.length > 0) {
        const allWorkAreas = await this.workAreaRepository.getAllWorkAreas();
        const validIds = new Set(allWorkAreas.map((wa) => wa.id));
        const invalidIds = workAreaIds.filter((id) => !validIds.has(id));

        if (invalidIds.length > 0) {
          return fail(
            new ValidationError(
              `Invalid work area IDs: ${invalidIds.join(", ")}`,
            ),
          );
        }
      }

      await this.workAreaRepository.replaceWorkAreas(
        preference.id,
        workAreaIds,
      );
      return ok(undefined);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update work areas"));
    }
  }
}
