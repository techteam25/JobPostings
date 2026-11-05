import { typesenseClient } from "@shared/config/typesense-client";
import { runMigrations } from "@shared/infrastructure/typesense.service/migrations/runner";
import logger from "@shared/logger";

async function main() {
  logger.info("Typesense migration runner starting...");

  try {
    const health = await typesenseClient.health.retrieve();
    if (!health.ok) {
      logger.error("Typesense is not healthy. Aborting migrations.");
      process.exit(1);
    }
    logger.info("Typesense connection verified");
  } catch (error) {
    logger.error("Cannot connect to Typesense. Is the service running?", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  const result = await runMigrations(typesenseClient);

  logger.info("---");
  logger.info(`Migrations applied: ${result.applied.length}`);
  logger.info(`Migrations skipped (already applied): ${result.skipped.length}`);

  if (result.failed) {
    logger.error(`Migration failed: ${result.failed}`);
    logger.error(
      "Fix the issue and re-run. Subsequent migrations were not attempted.",
    );
    process.exit(1);
  }

  if (result.applied.length === 0) {
    logger.info("No pending migrations. Schema is up to date.");
  } else {
    for (const name of result.applied) {
      logger.info(`  + ${name}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  logger.error(err, "Unhandled error in Typesense migration runner");
  process.exit(1);
});
