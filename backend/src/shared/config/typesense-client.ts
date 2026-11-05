import Typesense from "typesense";

import { env } from "@shared/config/env";
import { JOBS_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import logger from "@shared/logger";

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: env.TYPESENSE_HOST,
      port: env.TYPESENSE_PORT,
      protocol: env.TYPESENSE_PROTOCOL,
    },
  ],
  apiKey: env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 2,
  healthcheckIntervalSeconds: 30,
  retryIntervalSeconds: 1,
  timeoutSeconds: 10,
});

/**
 * Verify the Typesense schema exists at startup.
 * Does NOT create or modify the collection — use `bun run typesense:migrate` for that.
 */
export async function initializeTypesenseSchema() {
  const collections = await typesenseClient.collections().retrieve();
  const exists = collections.some((c) => c.name === JOBS_COLLECTION);

  if (!exists) {
    logger.warn(
      `Typesense collection '${JOBS_COLLECTION}' does not exist. Run 'bun run typesense:migrate' to create it.`,
    );
    return;
  }

  logger.info("Typesense schema verified");
}
