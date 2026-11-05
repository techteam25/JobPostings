import type { TypesenseMigration } from "./types";
import { JOBS_COLLECTION } from "../constants";

/**
 * Ensures existing postedJobs collections can sort by title. Fresh collections
 * already define this in 0000; older collections need an in-place schema update.
 */
const migration: TypesenseMigration = {
  name: "0007_enable-job-title-sort",
  description: "Enable title sorting for the postedJobs collection",
  collection: JOBS_COLLECTION,

  async up(client) {
    const schema = await client.collections(JOBS_COLLECTION).retrieve();
    const title = schema.fields?.find((field) => field.name === "title");

    if (title?.sort) return;

    await client.collections(JOBS_COLLECTION).update({
      fields: [
        ...(title ? [{ name: "title", drop: true as const }] : []),
        { name: "title", type: "string", sort: true },
      ],
    });
  },

  down: "Drop and re-add title without sort: true",
};

export default migration;
