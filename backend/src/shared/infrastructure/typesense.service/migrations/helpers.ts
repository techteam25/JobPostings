import type { Client } from "typesense";
import type { CollectionFieldSchema } from "typesense/lib/Typesense/Collection";

import logger from "@shared/logger";

/**
 * Add fields to an existing collection via PATCH. Idempotent: fields already
 * present on the collection are skipped, so a migration can re-run safely if
 * its tracking record was lost or the field was added out-of-band.
 */
export async function addFields(
  client: Client,
  collectionName: string,
  fields: CollectionFieldSchema[],
): Promise<void> {
  const existing = await client.collections(collectionName).retrieve();
  const existingFieldNames = new Set(existing.fields?.map((f) => f.name) ?? []);

  const toAdd = fields.filter((f) => !existingFieldNames.has(f.name));
  const skipped = fields
    .filter((f) => existingFieldNames.has(f.name))
    .map((f) => f.name);

  if (skipped.length > 0) {
    logger.warn(
      `addFields: field(s) already present on "${collectionName}", skipping: ${skipped.join(", ")}`,
    );
  }

  if (toAdd.length === 0) return;

  await client.collections(collectionName).update({ fields: toAdd });
}

/**
 * Drop fields from an existing collection via PATCH.
 * WARNING: Data in dropped fields is permanently lost.
 */
export async function dropFields(
  client: Client,
  collectionName: string,
  fieldNames: string[],
): Promise<void> {
  const fields = fieldNames.map((name) => ({ name, drop: true as const }));
  await client.collections(collectionName).update({ fields });
}

/**
 * Check if a Typesense collection exists.
 */
export async function collectionExists(
  client: Client,
  collectionName: string,
): Promise<boolean> {
  try {
    await client.collections(collectionName).retrieve();
    return true;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "httpStatus" in error &&
      (error as { httpStatus: number }).httpStatus === 404
    ) {
      return false;
    }
    throw error;
  }
}
