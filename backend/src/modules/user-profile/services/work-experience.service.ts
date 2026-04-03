import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { WorkExperienceServicePort } from "../ports/work-experience-service.port";
import type { WorkExperienceRepositoryPort } from "../ports/work-experience-repository.port";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import { AppError, DatabaseError, NotFoundError } from "@shared/errors";
import type { InsertWorkExperience } from "@/validations/workExperiences.validation";

export class WorkExperienceService
  extends BaseService
  implements WorkExperienceServicePort
{
  constructor(
    private workExperienceRepository: WorkExperienceRepositoryPort,
    private profileRepository: Pick<
      ProfileRepositoryPort,
      "findByIdWithProfile"
    >,
  ) {
    super();
  }

  async batchAddWorkExperiences(
    userId: number,
    data: Omit<InsertWorkExperience, "userProfileId">[],
  ) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result =
        await this.workExperienceRepository.batchAddWorkExperiences(
          user.profile.id,
          data,
        );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to add work experience entries"));
    }
  }

  async updateWorkExperience(
    workExperienceId: number,
    data: Partial<Omit<InsertWorkExperience, "userProfileId">>,
  ) {
    try {
      const result = await this.workExperienceRepository.updateWorkExperience(
        workExperienceId,
        data,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update work experience"));
    }
  }

  async deleteWorkExperience(workExperienceId: number) {
    try {
      const result =
        await this.workExperienceRepository.deleteWorkExperience(
          workExperienceId,
        );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to delete work experience"));
    }
  }
}
