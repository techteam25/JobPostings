import type {
  InsertWorkExperience,
  WorkExperience,
} from "@/validations/workExperiences.validation";

export interface WorkExperienceRepositoryPort {
  batchAddWorkExperiences(
    userProfileId: number,
    data: Omit<InsertWorkExperience, "userProfileId">[],
  ): Promise<WorkExperience[]>;

  updateWorkExperience(
    workExperienceId: number,
    data: Partial<Omit<InsertWorkExperience, "userProfileId">>,
  ): Promise<boolean>;

  deleteWorkExperience(workExperienceId: number): Promise<boolean>;
}
