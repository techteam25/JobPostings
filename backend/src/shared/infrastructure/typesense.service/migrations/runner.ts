import { createHash } from "crypto";
import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import type { Client } from "typesense";

import logger from "@shared/logger";
import { collectionExists } from "./helpers";
import type { TypesenseMigration, MigrationRecord } from "./types";
import { MIGRATIONS_COLLECTION } from "./types";

const MIGRATIONS_DIR = dirname(fileURLToPath(import.meta.url));

async function ensureMigrationsCollection(client: Client): Promise<void> {
  const exists = await collectionExists(client, MIGRATIONS_COLLECTION);
  if (!exists) {
    await client.collections().create({
      name: MIGRATIONS_COLLECTION,
      fields: [
        { name: "id", type: "string" },
        { name: "appliedAt", type: "int64" },
        { name: "checksum", type: "string" },
      ],
      default_sorting_field: "appliedAt",
    });
    logger.info(
      `Created migrations tracking collection: ${MIGRATIONS_COLLECTION}`,
    );
  }
}

async function getAppliedMigrations(
  client: Client,
): Promise<Map<string, MigrationRecord>> {
  const results = await client
    .collections<MigrationRecord>(MIGRATIONS_COLLECTION)
    .documents()
    .search({ q: "*", query_by: "checksum", per_page: 250 });

  const applied = new Map<string, MigrationRecord>();
  for (const hit of results.hits ?? []) {
    if (hit.document) {
      applied.set(hit.document.id, hit.document);
    }
  }
  return applied;
}

async function discoverMigrations(): Promise<TypesenseMigration[]> {
  const files = await readdir(MIGRATIONS_DIR);
  const migrationFiles = files
    .filter((f) => /^\d{4}_/.test(f) && f.endsWith(".ts"))
    .sort();

  const migrations: TypesenseMigration[] = [];
  for (const file of migrationFiles) {
    const mod = await import(join(MIGRATIONS_DIR, file));
    const migration = mod.default as TypesenseMigration | undefined;
    if (!migration?.name || !migration.up) {
      logger.warn(`Skipping invalid migration file: ${file}`);
      continue;
    }
    migrations.push(migration);
  }
  return migrations;
}

async function computeChecksum(filePath: string): Promise<string> {
  const content = await readFile(filePath, "utf-8");
  return createHash("sha256").update(content).digest("hex");
}

async function recordMigration(
  client: Client,
  name: string,
  checksum: string,
): Promise<void> {
  await client.collections(MIGRATIONS_COLLECTION).documents().create({
    id: name,
    appliedAt: Date.now(),
    checksum,
  });
}

export interface MigrateResult {
  applied: string[];
  skipped: string[];
  failed: string | null;
}

export async function runMigrations(client: Client): Promise<MigrateResult> {
  await ensureMigrationsCollection(client);

  const appliedMap = await getAppliedMigrations(client);
  const allMigrations = await discoverMigrations();

  const result: MigrateResult = { applied: [], skipped: [], failed: null };

  // Tamper detection: verify checksums of already-applied migrations
  for (const migration of allMigrations) {
    const record = appliedMap.get(migration.name);
    if (record) {
      const filePath = join(MIGRATIONS_DIR, `${migration.name}.ts`);
      const currentChecksum = await computeChecksum(filePath);
      if (currentChecksum !== record.checksum) {
        logger.error(
          `Checksum mismatch for already-applied migration "${migration.name}". ` +
            `The migration file was modified after it was applied. ` +
            `Expected: ${record.checksum}, Got: ${currentChecksum}`,
        );
        result.failed = migration.name;
        return result;
      }
    }
  }

  // Apply pending migrations in order
  for (const migration of allMigrations) {
    if (appliedMap.has(migration.name)) {
      result.skipped.push(migration.name);
      logger.info(`  [SKIP] ${migration.name} (already applied)`);
      continue;
    }

    logger.info(`  [APPLYING] ${migration.name}: ${migration.description}`);

    try {
      await migration.up(client);

      const filePath = join(MIGRATIONS_DIR, `${migration.name}.ts`);
      const checksum = await computeChecksum(filePath);
      await recordMigration(client, migration.name, checksum);

      result.applied.push(migration.name);
      logger.info(`  [APPLIED] ${migration.name}`);
    } catch (error) {
      logger.error(
        `  [FAILED] ${migration.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      result.failed = migration.name;
      return result;
    }
  }

  return result;
}

export async function getMigrationStatus(client: Client): Promise<{
  applied: MigrationRecord[];
  pending: string[];
}> {
  await ensureMigrationsCollection(client);

  const appliedMap = await getAppliedMigrations(client);
  const allMigrations = await discoverMigrations();

  const applied = Array.from(appliedMap.values()).sort(
    (a, b) => a.appliedAt - b.appliedAt,
  );
  const pending = allMigrations
    .filter((m) => !appliedMap.has(m.name))
    .map((m) => m.name);

  return { applied, pending };
}
