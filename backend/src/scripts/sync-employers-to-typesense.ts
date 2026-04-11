import { typesenseClient } from "@shared/config/typesense-client";
import { db } from "@shared/db/connection";
import { organizations } from "@/db/schema";
import { jobsDetails } from "@/db/schema";
import {
  EMPLOYERS_COLLECTION,
  JOBS_COLLECTION,
} from "@shared/infrastructure/typesense.service/constants";
import logger from "@shared/logger";

async function main() {
  logger.info("Syncing employers to Typesense...");

  // Verify Typesense is healthy
  const health = await typesenseClient.health.retrieve();
  if (!health.ok) {
    logger.error("Typesense is not healthy. Aborting sync.");
    process.exit(1);
  }

  // 1. Fetch all organizations from MySQL
  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
      city: organizations.city,
      state: organizations.state,
    })
    .from(organizations);

  logger.info(`Found ${orgs.length} organizations to sync`);

  if (orgs.length > 0) {
    // 2. Bulk-index employer documents into Typesense
    const employerDocs = orgs.map((org) => ({
      id: org.id.toString(),
      name: org.name,
      logoUrl: org.logoUrl ?? undefined,
      city: org.city,
      state: org.state,
    }));

    const importResults = await typesenseClient
      .collections(EMPLOYERS_COLLECTION)
      .documents()
      .import(employerDocs, { action: "upsert" });

    const failedImports = importResults.filter((r) => !r.success);
    if (failedImports.length > 0) {
      logger.error(
        `${failedImports.length} employer documents failed to import`,
        {
          errors: failedImports.slice(0, 5),
        },
      );
    }

    logger.info(
      `Indexed ${importResults.length - failedImports.length}/${orgs.length} employers`,
    );
  }

  // 3. Fetch all jobs and bulk-update them with employerId in Typesense
  const jobs = await db
    .select({
      id: jobsDetails.id,
      employerId: jobsDetails.employerId,
    })
    .from(jobsDetails);

  logger.info(`Found ${jobs.length} jobs to update with employerId`);

  let updatedCount = 0;
  let failedCount = 0;
  const BATCH_SIZE = 100;

  const jobUpdates = jobs.map((job) => ({
    id: job.id.toString(),
    employerId: job.employerId.toString(),
  }));

  for (let i = 0; i < jobUpdates.length; i += BATCH_SIZE) {
    const batch = jobUpdates.slice(i, i + BATCH_SIZE);
    const results = await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents()
      .import(batch, { action: "update", dirty_values: "coerce_or_drop" });

    const failed = results.filter((r) => !r.success);
    updatedCount += results.length - failed.length;
    failedCount += failed.length;

    if (failed.length > 0) {
      logger.warn(
        `${failed.length} jobs failed in batch starting at index ${i}`,
        { errors: failed.slice(0, 3) },
      );
    }
  }

  logger.info(
    `Updated ${updatedCount}/${jobs.length} jobs with employerId (${failedCount} failed)`,
  );

  logger.info("Employer sync complete");
  process.exit(0);
}

main().catch((err) => {
  logger.error(err, "Unhandled error in employer sync script");
  process.exit(1);
});
