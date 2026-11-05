import { eq, inArray } from "drizzle-orm";
import { educations } from "@/db/schema";
import { db } from "@shared/db/connection";
import { DatabaseError, NotFoundError } from "@shared/errors";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import type { EducationRepositoryPort } from "../ports/education-repository.port";
import type { InsertEducation } from "@/validations/educations.validation";

export class EducationRepository implements EducationRepositoryPort {
  async batchAddEducations(
    userProfileId: number,
    data: Omit<InsertEducation, "userProfileId">[],
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
            .insert(educations)
            .values(mapped)
            .$returningId();

          if (!insertedIds.length) {
            throw new DatabaseError("Failed to add education entries");
          }

          const ids = insertedIds.map((r) => r.id);

          return tx.query.educations.findMany({
            where: inArray(educations.id, ids),
          });
        }),
    );
  }

  async updateEducation(
    educationId: number,
    data: Partial<Omit<InsertEducation, "userProfileId">>,
  ) {
    return await withDbErrorHandling(async () => {
      const updateSet: Record<string, unknown> = { ...data };
      if (data.startDate) updateSet.startDate = new Date(data.startDate);
      if (data.endDate) updateSet.endDate = new Date(data.endDate);

      const [result] = await db
        .update(educations)
        .set(updateSet)
        .where(eq(educations.id, educationId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("Education", educationId);
      }

      return true;
    });
  }

  async deleteEducation(educationId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(educations)
        .where(eq(educations.id, educationId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("Education", educationId);
      }

      return true;
    });
  }
}
