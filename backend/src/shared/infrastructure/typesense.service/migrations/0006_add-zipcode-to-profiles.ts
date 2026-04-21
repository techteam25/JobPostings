import type { TypesenseMigration } from "./types";
import { PROFILES_COLLECTION } from "../constants";
import { addFields } from "./helpers";

/**
 * Adds a `zipCode` field to the profiles collection so candidate search can
 * filter by zip code. The existing `location` field is a single string
 * ("City, State, Country") that cannot tokenize against a postal code
 * picked from autocomplete — a separate field lets us AND it into the
 * filter query.
 *
 * The field is optional: profiles without a zip code stay indexable and
 * simply won't match zip-code filters. Existing documents will return
 * null for this field until re-indexed via
 * `bun run scripts/sync-profiles-to-typesense.ts`.
 */
const migration: TypesenseMigration = {
  name: "0006_add-zipcode-to-profiles",
  description:
    "Add optional zipCode field to the profiles collection for candidate zip-code filtering",
  collection: PROFILES_COLLECTION,

  async up(client) {
    await addFields(client, PROFILES_COLLECTION, [
      { name: "zipCode", type: "string", optional: true },
    ]);
  },

  down: "Drop the zipCode field: dropFields(client, 'profiles', ['zipCode'])",
};

export default migration;
