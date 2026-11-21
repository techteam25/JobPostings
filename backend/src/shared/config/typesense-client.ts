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
});

/** Verify the search fields this application needs without changing the collection. */
export async function initializeTypesenseSchema() {
  const collections = await typesenseClient.collections().retrieve();
  const exists = collections.some((c) => c.name === JOBS_COLLECTION);

  if (!exists) {
    throw new Error(
      `Typesense collection '${JOBS_COLLECTION}' does not exist. Run 'bun run typesense:migrate' to create it.`,
    );
  }

  const schema = await typesenseClient.collections(JOBS_COLLECTION).retrieve();
  const requiredFields = [
    { name: "isActive", type: "bool" },
    { name: "zipcode", type: "string" },
    { name: "compensationType", type: "string" },
    { name: "employerId", type: "string", reference: "employers.id" },
  ];
  const missing = requiredFields.filter((required) => {
    const field = schema.fields?.find((item) => item.name === required.name);
    return (
      !field ||
      field.type !== required.type ||
      ("reference" in required && field.reference !== required.reference)
    );
  });
  if (missing.length > 0) {
    throw new Error(
      `Typesense collection '${JOBS_COLLECTION}' is missing required search fields: ${missing.map((field) => field.name).join(", ")}. Check the Typesense server version and run its migrations.`,
    );
  }

  logger.info("Typesense schema verified");
}
