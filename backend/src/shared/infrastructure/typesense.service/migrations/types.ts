import type { Client } from "typesense";

export interface TypesenseMigration {
  /** Unique name matching the filename (without .ts), e.g. "0000_initial-schema" */
  name: string;
  /** Human-readable description of what this migration does */
  description: string;
  /** Target collection name */
  collection: string;
  /** Apply the migration */
  up(client: Client): Promise<void>;
  /**
   * Informational: describes what the reverse of this migration would be.
   * Not auto-executed. Typesense field drops are destructive (data is lost).
   */
  down?: string;
}

export interface MigrationRecord {
  id: string;
  appliedAt: number;
  checksum: string;
}

export const MIGRATIONS_COLLECTION = "_typesense_migrations";
