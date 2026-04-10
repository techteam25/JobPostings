import type { TypesenseMigration } from "./types";
import { JOBS_COLLECTION } from "../constants";
import { addFields } from "./helpers";

const migration: TypesenseMigration = {
  name: "0004_add-compensation-type",
  description:
    "Add compensationType facet field to postedJobs for filtering by compensation type",
  collection: JOBS_COLLECTION,

  async up(client) {
    await addFields(client, JOBS_COLLECTION, [
      {
        name: "compensationType",
        type: "string",
        facet: true,
      },
    ]);
  },

  down: "Drop the compensationType field: dropFields(client, 'postedJobs', ['compensationType'])",
};

export default migration;
