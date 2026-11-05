import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type { NewSkill, Skill } from "@/validations/skills.validation";

export interface SkillServicePort {
  linkSkill(
    userId: number,
    skillData: NewSkill,
  ): Promise<Result<Skill, AppError>>;

  unlinkSkill(
    userId: number,
    skillId: number,
  ): Promise<Result<boolean, AppError>>;

  searchSkills(query: string): Promise<Result<Skill[], AppError>>;
}
