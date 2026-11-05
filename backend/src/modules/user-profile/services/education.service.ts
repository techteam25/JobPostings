import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { EducationServicePort } from "../ports/education-service.port";
import type { EducationRepositoryPort } from "../ports/education-repository.port";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import { AppError, DatabaseError, NotFoundError } from "@shared/errors";
import type { InsertEducation } from "@/validations/educations.validation";

export class EducationService
  extends BaseService
  implements EducationServicePort
{
  constructor(
    private educationRepository: EducationRepositoryPort,
    private profileRepository: Pick<
      ProfileRepositoryPort,
      "findByIdWithProfile"
    >,
  ) {
    super();
  }

  async batchAddEducations(
    userId: number,
    data: Omit<InsertEducation, "userProfileId">[],
  ) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result = await this.educationRepository.batchAddEducations(
        user.profile.id,
        data,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to add education entries"));
    }
  }

  async updateEducation(
    educationId: number,
    data: Partial<Omit<InsertEducation, "userProfileId">>,
  ) {
    try {
      const result = await this.educationRepository.updateEducation(
        educationId,
        data,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update education"));
    }
  }

  async deleteEducation(educationId: number) {
    try {
      const result =
        await this.educationRepository.deleteEducation(educationId);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to delete education"));
    }
  }
}
