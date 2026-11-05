import type { TypesenseMigration } from "./types";
import { JOBS_COLLECTION } from "../constants";
import { collectionExists } from "./helpers";

const migration: TypesenseMigration = {
  name: "0000_initial-schema",
  description: "Create the postedJobs collection with the initial field set",
  collection: JOBS_COLLECTION,

  async up(client) {
    // Idempotent: if the collection already exists (pre-migration-system), skip creation
    if (await collectionExists(client, JOBS_COLLECTION)) {
      return;
    }

    await client.collections().create({
      name: JOBS_COLLECTION,
      fields: [
        { name: "id", type: "string" },
        { name: "title", type: "string", sort: true },
        { name: "company", type: "string" },
        { name: "description", type: "string" },
        { name: "city", type: "string", optional: true, facet: true },
        { name: "state", type: "string", optional: true, facet: true },
        { name: "country", type: "string", optional: true, facet: true },
        { name: "zipcode", type: "string", optional: true, facet: true },
        { name: "isRemote", type: "bool", facet: true },
        { name: "isActive", type: "bool", facet: true },
        { name: "experience", type: "string", optional: true, facet: true },
        { name: "jobType", type: "string", facet: true },
        { name: "skills", type: "string[]", facet: true },
        { name: "createdAt", type: "int64" },
      ],
      default_sorting_field: "createdAt",
    });
  },

  down: "Drop the postedJobs collection: client.collections('postedJobs').delete()",
};

export default migration;
