import type { TypesenseMigration } from "./types";
import { PROFILES_COLLECTION } from "../constants";
import { collectionExists } from "./helpers";

/**
 * Creates the profiles collection powering employer-facing candidate search.
 * Only seeker users with public profiles are indexed here; the
 * isProfilePublic/intent fields exist as defense-in-depth filter guards at
 * query time.
 */
const migration: TypesenseMigration = {
  name: "0005_profiles-collection",
  description:
    "Create the profiles collection for employer-facing candidate search",
  collection: PROFILES_COLLECTION,

  async up(client) {
    if (await collectionExists(client, PROFILES_COLLECTION)) {
      return;
    }

    await client.collections().create({
      name: PROFILES_COLLECTION,
      fields: [
        { name: "id", type: "string" },
        { name: "userId", type: "int64" },
        { name: "name", type: "string" },
        { name: "photoUrl", type: "string", optional: true },
        { name: "headline", type: "string" },
        { name: "skills", type: "string[]", facet: true },
        { name: "location", type: "string", facet: true },
        { name: "yearsOfExperience", type: "int32" },
        { name: "openToWork", type: "bool", facet: true },
        { name: "isProfilePublic", type: "bool", facet: true },
        { name: "intent", type: "string", facet: true },
        { name: "updatedAt", type: "int64" },
      ],
      default_sorting_field: "updatedAt",
    });
  },

  down: "Drop the candidateProfiles collection: client.collections('candidateProfiles').delete()",
};

export default migration;
