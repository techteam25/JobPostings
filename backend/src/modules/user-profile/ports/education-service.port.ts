import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type {
  Education,
  InsertEducation,
} from "@/validations/educations.validation";

export interface EducationServicePort {
  batchAddEducations(
    userId: number,
    data: Omit<InsertEducation, "userProfileId">[],
  ): Promise<Result<Education[], AppError>>;

  updateEducation(
    educationId: number,
    data: Partial<Omit<InsertEducation, "userProfileId">>,
  ): Promise<Result<boolean, AppError>>;

  deleteEducation(educationId: number): Promise<Result<boolean, AppError>>;
}
