import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { typesenseClient } from "@shared/config/typesense-client";
import { db } from "@shared/db/connection";
import { user } from "@/db/schema";
import { PROFILES_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import { buildCandidateSearchDocument } from "@/modules/user-profile";
import type { ProfileDocument } from "@shared/ports/typesense-profile-service.port";
import logger from "@shared/logger";

/**
 * Backfills the `candidateProfiles` Typesense collection from MySQL.
 *
 * Walks every seeker with `deletedAt IS NULL`, eager-loads profile + skills
 * + work-experiences, runs each row through `buildCandidateSearchDocument`,
 * and upserts eligible docs in batches. The builder returns `null` for
 * ineligible users (non-public profile, missing profile row, etc.); those
 * are counted as skipped rather than errors.
 *
 * Idempotent — safe to re-run. Resilient — a single bad row logs with its
 * userId and the run continues. Exits non-zero if any document failed.
 *
 *   bun src/scripts/sync-profiles-to-typesense.ts
 */

const DB_PAGE_SIZE = 500;
const INDEX_BATCH_SIZE = 100;

async function main() {
  logger.info("Syncing candidate profiles to Typesense...");

  const health = await typesenseClient.health.retrieve();
  if (!health.ok) {
    logger.error("Typesense is not healthy. Aborting sync.");
    process.exit(1);
  }

  let succeeded = 0;
  let skippedNull = 0;
  let failed = 0;
  let processed = 0;
  let lastId = 0;

  while (true) {
    const rows = await db.query.user.findMany({
      where: and(
        eq(user.intent, "seeker"),
        isNull(user.deletedAt),
        gt(user.id, lastId),
      ),
      orderBy: [asc(user.id)],
      limit: DB_PAGE_SIZE,
      columns: {
        id: true,
        fullName: true,
        intent: true,
        deletedAt: true,
      },
      with: {
        profile: {
          columns: {
            profilePicture: true,
            bio: true,
            city: true,
            state: true,
            country: true,
            zipCode: true,
            isProfilePublic: true,
            isAvailableForWork: true,
          },
          with: {
            workExperiences: {
              columns: {
                jobTitle: true,
                current: true,
                startDate: true,
                endDate: true,
              },
            },
            skills: {
              columns: {},
              with: {
                skill: { columns: { name: true } },
              },
            },
          },
        },
      },
    });

    if (rows.length === 0) break;

    const docs: { doc: ProfileDocument; userId: number }[] = [];
    for (const row of rows) {
      const doc = buildCandidateSearchDocument({
        user: {
          id: row.id,
          fullName: row.fullName,
          intent: row.intent,
          deletedAt: row.deletedAt,
        },
        userProfile: row.profile
          ? {
              profilePicture: row.profile.profilePicture ?? null,
              bio: row.profile.bio ?? null,
              city: row.profile.city ?? null,
              state: row.profile.state ?? null,
              country: row.profile.country ?? null,
              zipCode: row.profile.zipCode ?? null,
              isProfilePublic: row.profile.isProfilePublic,
              isAvailableForWork: row.profile.isAvailableForWork,
            }
          : null,
        workExperiences: row.profile?.workExperiences ?? [],
        skills: (row.profile?.skills ?? []).map((s) => s.skill.name),
      });
      if (doc === null) {
        skippedNull += 1;
      } else {
        docs.push({ doc, userId: row.id });
      }
    }

    for (let i = 0; i < docs.length; i += INDEX_BATCH_SIZE) {
      const slice = docs.slice(i, i + INDEX_BATCH_SIZE);
      try {
        const results = await typesenseClient
          .collections(PROFILES_COLLECTION)
          .documents()
          .import(
            slice.map((s) => s.doc),
            { action: "upsert" },
          );

        results.forEach((r, idx) => {
          if (r.success) {
            succeeded += 1;
          } else {
            failed += 1;
            logger.error(
              {
                userId: slice[idx]?.userId,
                error: r.error,
                document: r.document,
              },
              "Failed to index candidate profile document",
            );
          }
        });
      } catch (err) {
        failed += slice.length;
        logger.error(
          {
            error: err instanceof Error ? err.message : String(err),
            batchUserIds: slice.map((s) => s.userId),
          },
          "Batch import threw — marking batch failed and continuing",
        );
      }
    }

    processed += rows.length;
    const lastRow = rows[rows.length - 1];
    if (!lastRow) break;
    lastId = lastRow.id;

    logger.info(
      `Progress — scanned ${processed} seekers (succeeded=${succeeded}, skipped=${skippedNull}, failed=${failed})`,
    );

    if (rows.length < DB_PAGE_SIZE) break;
  }

  logger.info(
    `Candidate profile sync complete — succeeded=${succeeded}, skippedNull=${skippedNull}, failed=${failed}, totalScanned=${processed}`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  logger.error(err, "Unhandled error in candidate profile sync script");
  process.exit(1);
});
