import type { TypesenseMigration } from "./types";
import { USER_PROFILES_COLLECTION } from "../constants";
import { collectionExists } from "./helpers";

/**
 * Creates the userProfiles collection for indexing job seeker preference data.
 *
 * Cross-collection matching notes (for future recommendations story):
 * - jobTypes values align with postedJobs.jobType ("full-time", "part-time", etc.)
 * - compensationTypes values align with postedJobs.compensationType
 * - workArrangements has no direct equivalent in postedJobs yet (only isRemote boolean)
 */
const migration: TypesenseMigration = {
  name: "0001_user-profiles-collection",
  description:
    "Create the userProfiles collection for job seeker preference indexing",
  collection: USER_PROFILES_COLLECTION,

  async up(client) {
    if (await collectionExists(client, USER_PROFILES_COLLECTION)) {
      return;
    }

    await client.collections().create({
      name: USER_PROFILES_COLLECTION,
      fields: [
        { name: "id", type: "string" },
        { name: "userId", type: "int64" },
        { name: "jobTypes", type: "string[]", facet: true },
        { name: "compensationTypes", type: "string[]", facet: true },
        { name: "workScheduleDays", type: "string[]", facet: true },
        { name: "scheduleTypes", type: "string[]", facet: true },
        { name: "workArrangements", type: "string[]", facet: true },
        { name: "commuteTime", type: "string", optional: true, facet: true },
        {
          name: "willingnessToRelocate",
          type: "string",
          optional: true,
          facet: true,
        },
        {
          name: "volunteerHoursPerWeek",
          type: "string",
          optional: true,
          facet: true,
        },
        { name: "workAreas", type: "string[]", facet: true },
        { name: "updatedAt", type: "int64" },
      ],
    });
  },

  down: "Drop the userProfiles collection: client.collections('userProfiles').delete()",
};

export default migration;
