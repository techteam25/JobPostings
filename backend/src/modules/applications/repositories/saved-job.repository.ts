import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { jobsDetails, savedJobs } from "@/db/schema";
import { db } from "@shared/db/connection";
import { DatabaseError, NotFoundError } from "@shared/errors";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import type { SavedJobRepositoryPort } from "../ports/saved-job-repository.port";

export class SavedJobRepository implements SavedJobRepositoryPort {
  async getSavedJobsForUser(userId: number, page: number, limit: number) {
    return withDbErrorHandling(async () => {
      const offset = Math.max(0, (page - 1) * limit);
      const userSavedJobs = await db.query.savedJobs.findMany({
        limit,
        offset,
        orderBy: [desc(savedJobs.savedAt)],
        where: eq(savedJobs.userId, userId),
        columns: {
          id: true,
          savedAt: true,
        },
        with: {
          job: {
            columns: {
              id: true,
              title: true,
              city: true,
              state: true,
              country: true,
              jobType: true,
              compensationType: true,
              isRemote: true,
              isActive: true,
              applicationDeadline: true,
            },
            with: {
              employer: {
                columns: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  url: true,
                },
              },
            },
          },
        },
      });

      const response = userSavedJobs.map((savedJob) => ({
        ...savedJob,
        isClosed: savedJob.job.applicationDeadline
          ? new Date(savedJob.job.applicationDeadline) < new Date()
          : false,
        isExpired: !savedJob.job.isActive,
      }));

      const [totalResult] = await db
        .select({ total: count() })
        .from(savedJobs)
        .where(eq(savedJobs.userId, userId));
      const total = totalResult?.total ?? 0;

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;
      return {
        items: response,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext,
          hasPrevious,
          nextPage: hasNext ? page + 1 : null,
          previousPage: hasPrevious ? page - 1 : null,
        },
      };
    });
  }

  async countSavedJobs(userId: number) {
    return withDbErrorHandling(async () => {
      return await db.$count(savedJobs, eq(savedJobs.userId, userId));
    });
  }

  async saveJobForUser(userId: number, jobId: number) {
    return withDbErrorHandling(async () => {
      return await db.transaction(async (tx) => {
        const jobExists = await tx.query.jobsDetails.findFirst({
          where: eq(jobsDetails.id, jobId),
          columns: { id: true },
        });

        if (!jobExists) {
          throw new NotFoundError("Job", jobId);
        }

        const [result] = await tx
          .insert(savedJobs)
          .values({
            userId,
            jobId,
            savedAt: sql.raw("CURRENT_TIMESTAMP"),
          })
          .onDuplicateKeyUpdate({
            set: {
              savedAt: sql.raw("CURRENT_TIMESTAMP"),
            },
          })
          .$returningId();

        if (!result || isNaN(result.id)) {
          throw new DatabaseError(`Invalid insertId returned: ${result?.id}`);
        }

        return { success: true };
      });
    });
  }

  async isJobSavedByUser(userId: number, jobId: number) {
    return withDbErrorHandling(async () => {
      const savedJob = await db.query.savedJobs.findFirst({
        where: and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)),
        columns: {
          id: true,
        },
      });

      return !!savedJob;
    });
  }

  async getSavedJobIdsForJobs(
    userId: number,
    jobIds: number[],
  ): Promise<Set<number>> {
    return withDbErrorHandling(async () => {
      const saved = await db.query.savedJobs.findMany({
        where: and(
          eq(savedJobs.userId, userId),
          inArray(savedJobs.jobId, jobIds),
        ),
        columns: { jobId: true },
      });

      return new Set(saved.map((s) => s.jobId));
    });
  }

  async unsaveJobForUser(userId: number, jobId: number) {
    return withDbErrorHandling(async () => {
      const savedJob = await db.query.savedJobs.findFirst({
        where: and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)),
        columns: {
          id: true,
        },
      });

      if (!savedJob) {
        throw new NotFoundError("Job", jobId);
      }

      const [deletedResult] = await db
        .delete(savedJobs)
        .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)));

      if (!deletedResult || deletedResult.affectedRows === 0) {
        throw new DatabaseError("Failed to unsave job: record not found");
      }

      return { success: true };
    });
  }
}
