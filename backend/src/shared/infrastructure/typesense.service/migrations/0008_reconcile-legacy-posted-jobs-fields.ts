import type { TypesenseMigration } from "./types";
import { JOBS_COLLECTION } from "../constants";
import { addFields } from "./helpers";

const expectedFields = [
  { name: "zipcode", type: "string", facet: true, optional: true },
  { name: "isActive", type: "bool", facet: true, optional: false },
] as const;

type Field = {
  name: string;
  type: string;
  facet?: boolean;
  optional?: boolean;
};

function verifyFields(fields: Field[] | undefined, requireAll: boolean): void {
  for (const expected of expectedFields) {
    const actual = fields?.find((field) => field.name === expected.name);
    if (!actual && !requireAll) continue;
    if (
      !actual ||
      actual.type !== expected.type ||
      actual.facet !== expected.facet ||
      (actual.optional === true) !== expected.optional
    ) {
      throw new Error(
        `${JOBS_COLLECTION}.${expected.name} must be ${expected.type}, facet: ${expected.facet}, optional: ${expected.optional}`,
      );
    }
  }
}

const migration: TypesenseMigration = {
  name: "0008_reconcile-legacy-posted-jobs-fields",
  description:
    "Add and verify required search fields missing from legacy postedJobs collections",
  collection: JOBS_COLLECTION,

  async up(client) {
    const before = await client.collections(JOBS_COLLECTION).retrieve();
    const existingFields = before.fields as Field[] | undefined;
    verifyFields(existingFields, false);
    const hasIsActive = existingFields?.some(
      (field) => field.name === "isActive",
    );

    if (!hasIsActive) {
      const count = before.num_documents;
      if (!Number.isSafeInteger(count) || count > 0) {
        throw new Error(
          `Cannot add required isActive to ${JOBS_COLLECTION}: ` +
            `${count ?? "unknown"} existing documents need a reviewed backfill`,
        );
      }
    }

    await addFields(client, JOBS_COLLECTION, [...expectedFields]);
    const after = await client.collections(JOBS_COLLECTION).retrieve();
    verifyFields(after.fields as Field[] | undefined, true);
  },
};

export default migration;
