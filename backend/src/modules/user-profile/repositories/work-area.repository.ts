import { eq, asc } from "drizzle-orm";
import { workAreas, jobPreferenceWorkAreas } from "@/db/schema";
import { BaseRepository } from "@shared/base/base.repository";
import { db } from "@shared/db/connection";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import type {
  WorkArea,
  WorkAreaRepositoryPort,
} from "../ports/work-area-repository.port";

export class WorkAreaRepository
  extends BaseRepository<typeof workAreas>
  implements WorkAreaRepositoryPort
{
  constructor() {
    super(workAreas, "WorkArea");
  }

  async getAllWorkAreas(): Promise<WorkArea[]> {
    return await withDbErrorHandling(async () => {
      return db
        .select({ id: workAreas.id, name: workAreas.name })
        .from(workAreas)
        .orderBy(asc(workAreas.name));
    });
  }

  async getSelectedWorkAreas(jobPreferenceId: number): Promise<WorkArea[]> {
    return await withDbErrorHandling(async () => {
      return db
        .select({ id: workAreas.id, name: workAreas.name })
        .from(jobPreferenceWorkAreas)
        .innerJoin(
          workAreas,
          eq(jobPreferenceWorkAreas.workAreaId, workAreas.id),
        )
        .where(eq(jobPreferenceWorkAreas.jobPreferenceId, jobPreferenceId))
        .orderBy(asc(workAreas.name));
    });
  }

  async replaceWorkAreas(
    jobPreferenceId: number,
    workAreaIds: number[],
  ): Promise<void> {
    await withDbErrorHandling(async () => {
      await db.transaction(async (tx) => {
        await tx
          .delete(jobPreferenceWorkAreas)
          .where(eq(jobPreferenceWorkAreas.jobPreferenceId, jobPreferenceId));

        if (workAreaIds.length > 0) {
          await tx.insert(jobPreferenceWorkAreas).values(
            workAreaIds.map((workAreaId) => ({
              jobPreferenceId,
              workAreaId,
            })),
          );
        }
      });
    });
  }
}
