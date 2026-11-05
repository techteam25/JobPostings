import { eq, inArray } from "drizzle-orm";
import { workExperiences } from "@/db/schema";
import { db } from "@shared/db/connection";
import { DatabaseError, NotFoundError } from "@shared/errors";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import type { WorkExperienceRepositoryPort } from "../ports/work-experience-repository.port";
import type { InsertWorkExperience } from "@/validations/workExperiences.validation";

export class WorkExperienceRepository implements WorkExperienceRepositoryPort {
  async batchAddWorkExperiences(
    userProfileId: number,
    data: Omit<InsertWorkExperience, "userProfileId">[],
  ) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const mapped = data.map((entry) => ({
            ...entry,
            userProfileId,
            startDate: new Date(entry.startDate),
            endDate: entry.endDate ? new Date(entry.endDate) : null,
          }));

          const insertedIds = await tx
            .insert(workExperiences)
            .values(mapped)
            .$returningId();

          if (!insertedIds.length) {
            throw new DatabaseError("Failed to add work experience entries");
          }

          const ids = insertedIds.map((r) => r.id);

          return tx.query.workExperiences.findMany({
            where: inArray(workExperiences.id, ids),
          });
        }),
    );
  }

  async updateWorkExperience(
    workExperienceId: number,
    data: Partial<Omit<InsertWorkExperience, "userProfileId">>,
  ) {
    return await withDbErrorHandling(async () => {
      const updateSet: Record<string, unknown> = { ...data };
      if (data.startDate) updateSet.startDate = new Date(data.startDate);
      if (data.endDate) updateSet.endDate = new Date(data.endDate);

      const [result] = await db
        .update(workExperiences)
        .set(updateSet)
        .where(eq(workExperiences.id, workExperienceId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("WorkExperience", workExperienceId);
      }

      return true;
    });
  }

  async deleteWorkExperience(workExperienceId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(workExperiences)
        .where(eq(workExperiences.id, workExperienceId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("WorkExperience", workExperienceId);
      }

      return true;
    });
  }
}
