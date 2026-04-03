import type { NewSkill, Skill } from "@/validations/skills.validation";

export interface SkillRepositoryPort {
  linkSkill(userProfileId: number, skillData: NewSkill): Promise<Skill>;
  unlinkSkill(userProfileId: number, skillId: number): Promise<boolean>;
  searchSkills(query: string): Promise<Skill[]>;
  countUserSkills(userProfileId: number): Promise<number>;
}
