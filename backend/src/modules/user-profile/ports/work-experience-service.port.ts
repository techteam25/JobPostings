import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type {
  InsertWorkExperience,
  WorkExperience,
} from "@/validations/workExperiences.validation";

export interface WorkExperienceServicePort {
  batchAddWorkExperiences(
    userId: number,
    data: Omit<InsertWorkExperience, "userProfileId">[],
  ): Promise<Result<WorkExperience[], AppError>>;

  updateWorkExperience(
    userId: number,
    workExperienceId: number,
    data: Partial<Omit<InsertWorkExperience, "userProfileId">>,
  ): Promise<Result<boolean, AppError>>;

  deleteWorkExperience(
    userId: number,
    workExperienceId: number,
  ): Promise<Result<boolean, AppError>>;
}
