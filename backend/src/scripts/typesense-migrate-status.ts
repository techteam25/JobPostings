import { typesenseClient } from "@shared/config/typesense-client";
import { getMigrationStatus } from "@shared/infrastructure/typesense.service/migrations/runner";
import logger from "@shared/logger";

async function main() {
  logger.info("Typesense migration status");
  logger.info("---");

  try {
    const health = await typesenseClient.health.retrieve();
    if (!health.ok) {
      logger.error("Typesense is not healthy.");
      process.exit(1);
    }
  } catch (error) {
    logger.error("Cannot connect to Typesense.", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  const status = await getMigrationStatus(typesenseClient);

  if (status.applied.length > 0) {
    logger.info("Applied migrations:");
    for (const record of status.applied) {
      const date = new Date(record.appliedAt).toISOString();
      logger.info(`  [APPLIED] ${record.id} (at ${date})`);
    }
  } else {
    logger.info("No migrations have been applied yet.");
  }

  if (status.pending.length > 0) {
    logger.info("Pending migrations:");
    for (const name of status.pending) {
      logger.info(`  [PENDING] ${name}`);
    }
  } else {
    logger.info("No pending migrations.");
  }

  process.exit(0);
}

main().catch((err) => {
  logger.error(err, "Unhandled error");
  process.exit(1);
});
