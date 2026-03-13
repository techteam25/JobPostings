import type { Client } from "typesense";
import type { CollectionFieldSchema } from "typesense/lib/Typesense/Collection";

/**
 * Add fields to an existing collection via PATCH.
 * Existing documents will have null for the new fields until re-indexed.
 */
export async function addFields(
  client: Client,
  collectionName: string,
  fields: CollectionFieldSchema[],
): Promise<void> {
  await client.collections(collectionName).update({ fields });
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
