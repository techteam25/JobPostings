import { and, count, eq, like, sql } from "drizzle-orm";
import { skills, userSkills } from "@/db/schema";
import { db } from "@shared/db/connection";
import { DatabaseError, NotFoundError } from "@shared/errors";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import { SecurityUtils } from "@shared/utils/security";
import type { SkillRepositoryPort } from "../ports/skill-repository.port";
import type { NewSkill } from "@/validations/skills.validation";

export class SkillRepository implements SkillRepositoryPort {
  async linkSkill(userProfileId: number, skillData: NewSkill) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          await tx
            .insert(skills)
            .values(skillData)
            .onDuplicateKeyUpdate({
              set: {
                name: sql`values(${skills.name})`,
              },
            });

          const skill = await tx.query.skills.findFirst({
            where: eq(skills.name, skillData.name),
          });

          if (!skill) {
            throw new DatabaseError("Failed to create skill");
          }

          await tx
            .insert(userSkills)
            .values({
              skillId: skill.id,
              userProfileId,
            })
            .onDuplicateKeyUpdate({
              set: {
                skillId: sql`values(${userSkills.skillId})`,
              },
            });

          return skill;
        }),
    );
  }

  async unlinkSkill(userProfileId: number, skillId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(userSkills)
        .where(
          and(
            eq(userSkills.userProfileId, userProfileId),
            eq(userSkills.skillId, skillId),
          ),
        );

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("Skill", skillId);
      }

      return true;
    });
  }

  async searchSkills(query: string) {
    return await withDbErrorHandling(async () => {
      const escaped = SecurityUtils.escapeLikePattern(query);
      return db
        .select()
        .from(skills)
        .where(like(skills.name, `%${escaped}%`))
        .limit(20);
    });
  }

  async countUserSkills(userProfileId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .select({ count: count() })
        .from(userSkills)
        .where(eq(userSkills.userProfileId, userProfileId));
      return result?.count ?? 0;
    });
  }
}
