import { typesenseClient } from "@shared/config/typesense-client";
import { db } from "@shared/db/connection";
import { JOBS_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import { TypesenseJobService } from "@shared/infrastructure/typesense.service/typesense.service";
import type { JobWithSkills } from "@/validations/job.validation";
import logger from "@shared/logger";

/**
 * Reindexes every job row from MySQL into the Typesense `postedJobs`
 * collection. Intended to be run after `bun run db:seed` (or any other
 * operation that rewrites the `job_details` table) because the seed drops
 * rows and resets auto-increment, leaving stale Typesense documents whose
 * IDs no longer match the live DB. Run with:
 *
 *   bun src/scripts/sync-jobs-to-typesense.ts
 */
async function main() {
  logger.info("Syncing jobs to Typesense...");

  const health = await typesenseClient.health.retrieve();
  if (!health.ok) {
    logger.error("Typesense is not healthy. Aborting sync.");
    process.exit(1);
  }

  // 1. Pull every job with the fields the indexer needs. We grab the
  //    employer-name relation and the full skills list so the document
  //    matches the `postedJobs` schema without further DB roundtrips.
  const rawJobs = await db.query.jobsDetails.findMany({
    with: {
      employer: {
        columns: { name: true },
      },
      skills: {
        with: {
          skill: {
            columns: { name: true },
          },
        },
      },
    },
  });
  logger.info(`Found ${rawJobs.length} jobs in MySQL`);

  if (rawJobs.length === 0) {
    logger.info("Nothing to sync. Done.");
    process.exit(0);
  }

  // 2. Shape into JobWithSkills (flatten the skill join, assert employer).
  const jobs: JobWithSkills[] = rawJobs
    .filter((job) => job.employer !== null)
    .map((job) => ({
      ...job,
      employer: { name: job.employer!.name },
      skills: job.skills.map((s) => s.skill.name),
    }));

  const skipped = rawJobs.length - jobs.length;
  if (skipped > 0) {
    logger.warn(`${skipped} job(s) had no employer and were skipped`);
  }

  // 3. Purge stale Typesense documents so orphaned IDs from previous DB
  //    generations don't leak into search results. `createdAt` is a
  //    required int64 field on every indexed document, so this filter
  //    matches the whole collection.
  try {
    const purgeResult = await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents()
      .delete({ filter_by: "createdAt:>=0" });
    logger.info(
      `Purged ${purgeResult.num_deleted} stale job documents from Typesense`,
    );
  } catch (err) {
    logger.warn(
      "Purge step failed (collection may already be empty) — continuing",
      { error: err instanceof Error ? err.message : String(err) },
    );
  }

  // 4. Bulk upsert via the service so we go through the same field-mapping
  //    helper that the single-doc indexer uses. Any schema drift will break
  //    in exactly one place.
  const service = new TypesenseJobService();
  const importResults = await service.indexManyJobDocuments(jobs);

  const failures = importResults.filter((r) => !r.success);
  if (failures.length > 0) {
    logger.error(`${failures.length} job documents failed to index`, {
      first5: failures.slice(0, 5),
    });
  }

  logger.info(
    `Indexed ${importResults.length - failures.length}/${jobs.length} jobs`,
  );
  logger.info("Job sync complete");
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  logger.error(err, "Unhandled error in job sync script");
  process.exit(1);
});
