import type {
  Education,
  InsertEducation,
} from "@/validations/educations.validation";

export interface EducationRepositoryPort {
  batchAddEducations(
    userProfileId: number,
    data: Omit<InsertEducation, "userProfileId">[],
  ): Promise<Education[]>;

  updateEducation(
    educationId: number,
    data: Partial<Omit<InsertEducation, "userProfileId">>,
  ): Promise<boolean>;

  deleteEducation(educationId: number): Promise<boolean>;
}
