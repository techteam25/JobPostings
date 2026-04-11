import type { TypesenseMigration } from "./types";
import { EMPLOYERS_COLLECTION } from "../constants";
import { collectionExists } from "./helpers";

const migration: TypesenseMigration = {
  name: "0002_employers-collection",
  description:
    "Create the employers collection for organization data (enables JOIN with postedJobs)",
  collection: EMPLOYERS_COLLECTION,

  async up(client) {
    if (await collectionExists(client, EMPLOYERS_COLLECTION)) {
      return;
    }

    await client.collections().create({
      name: EMPLOYERS_COLLECTION,
      fields: [
        { name: "id", type: "string" },
        { name: "name", type: "string", sort: true },
        { name: "logoUrl", type: "string", optional: true },
        { name: "city", type: "string", optional: true },
        { name: "state", type: "string", optional: true },
      ],
    });
  },

  down: "Drop the employers collection: client.collections('employers').delete()",
};

export default migration;
