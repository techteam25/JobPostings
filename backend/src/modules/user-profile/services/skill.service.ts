import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { SkillServicePort } from "../ports/skill-service.port";
import type { SkillRepositoryPort } from "../ports/skill-repository.port";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@shared/errors";
import type { NewSkill } from "@/validations/skills.validation";
import { enqueueCandidateSearchSync } from "@shared/infrastructure/typesense.service/candidate-search-enqueue";

export class SkillService extends BaseService implements SkillServicePort {
  private static readonly MAX_SKILLS = 30;

  constructor(
    private skillRepository: SkillRepositoryPort,
    private profileRepository: Pick<
      ProfileRepositoryPort,
      "findByIdWithProfile"
    >,
  ) {
    super();
  }

  async linkSkill(userId: number, skillData: NewSkill) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const skillCount = await this.skillRepository.countUserSkills(
        user.profile.id,
      );

      if (skillCount >= SkillService.MAX_SKILLS) {
        return fail(
          new ValidationError(
            `Maximum ${SkillService.MAX_SKILLS} skills allowed. Remove a skill before adding a new one.`,
          ),
        );
      }

      const result = await this.skillRepository.linkSkill(
        user.profile.id,
        skillData,
      );

      await enqueueCandidateSearchSync(userId, "updateProfile");

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to link skill"));
    }
  }

  async unlinkSkill(userId: number, skillId: number) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result = await this.skillRepository.unlinkSkill(
        user.profile.id,
        skillId,
      );

      await enqueueCandidateSearchSync(userId, "updateProfile");

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to unlink skill"));
    }
  }

  async searchSkills(query: string) {
    try {
      const result = await this.skillRepository.searchSkills(query);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to search skills"));
    }
  }
}
