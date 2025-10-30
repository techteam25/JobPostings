import Typesense from "typesense";

import { env } from "./env";
import { JOBS_COLLECTION } from "@/services/typesense.service/constants";

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
});

// Explicit initialization function
export async function initializeTypesenseSchema() {
  const collections = await typesenseClient.collections().retrieve();
  const exists = collections.some((c) => c.name === JOBS_COLLECTION);

  if (!exists) {
    await typesenseClient.collections().create({
      name: JOBS_COLLECTION,
      fields: [
        { name: "id", type: "string" },
        { name: "title", type: "string", sort: true },
        { name: "company", type: "string" },
        { name: "description", type: "string" },
        { name: "city", type: "string", optional: true, facet: true },
        { name: "state", type: "string", optional: true, facet: true },
        { name: "country", type: "string", optional: true, facet: true },
        { name: "isRemote", type: "bool", facet: true },
        { name: "experience", type: "string", optional: true, facet: true },
        { name: "jobType", type: "string", facet: true },
        { name: "skills", type: "string[]", facet: true },
        { name: "createdAt", type: "int64" },
      ],
      default_sorting_field: "createdAt",
    });
    console.log("✅ Typesense collection created");
  }
}
