import type { TypesenseMigration } from "./types";
import { JOBS_COLLECTION } from "../constants";
import { addFields } from "./helpers";

const migration: TypesenseMigration = {
  name: "0003_add-employer-reference",
  description:
    "Add employerId reference field to postedJobs for JOIN with employers collection",
  collection: JOBS_COLLECTION,

  async up(client) {
    await addFields(client, JOBS_COLLECTION, [
      {
        name: "employerId",
        type: "string",
        reference: "employers.id",
        optional: true,
      },
    ]);
  },

  down: "Drop the employerId field: dropFields(client, 'postedJobs', ['employerId'])",
};

export default migration;
