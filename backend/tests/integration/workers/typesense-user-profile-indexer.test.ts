import { QueueEvents } from "bullmq";
import { typesenseClient } from "@shared/config/typesense-client";
import { USER_PROFILES_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import { TypesenseUserProfileService } from "@shared/infrastructure/typesense.service/typesense-user-profile.service";
import { createTypesenseUserProfileIndexerWorker } from "@/modules/user-profile/workers/typesense-user-profile-indexer.worker";
import type { Job as BullMqJob } from "bullmq";
import type { UserProfileDocument } from "@shared/ports/typesense-user-profile-service.port";
import { createUser } from "@tests/utils/seedBuilders";
import { env } from "@shared/config/env";

// Override the global queue mock — this test needs real Redis queue + Typesense
vi.mock("@shared/infrastructure/queue.service", async (importOriginal) => {
  return await importOriginal();
});

const typesenseUserProfileService = new TypesenseUserProfileService();

/**
 * Wait for a BullMQ job to reach a terminal state (completed or failed)
 * using QueueEvents instead of polling Typesense or sleeping.
 */
let queueEvents: QueueEvents;

async function waitForJobFinished(
  job: BullMqJob,
  timeout = 10_000,
): Promise<void> {
  await job.waitUntilFinished(queueEvents, timeout);
}

async function cleanTypesenseCollection(): Promise<void> {
  try {
    await typesenseClient.collections(USER_PROFILES_COLLECTION).delete();
  } catch {
    // Collection may not exist yet
  }

  // Recreate collection for tests
  await typesenseClient.collections().create({
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
}

describe("Typesense User Profile Indexer Integration Tests", () => {
  vi.setConfig({ testTimeout: 30_000 });

  let seededUserId: number;

  beforeAll(async () => {
    await queueService.initialize();

    // Create a QueueEvents listener for deterministic job-completion waits
    queueEvents = new QueueEvents(QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE, {
      connection: {
        url: env.REDIS_QUEUE_URL,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
    });
    await queueEvents.waitUntilReady();

    const worker = createTypesenseUserProfileIndexerWorker({
      typesenseUserProfileService,
    });
    worker.initialize();

    await cleanTypesenseCollection();
  });

  // Seed a real user after cleanAll() so the worker's DB guard passes
  beforeEach(async () => {
    const user = await createUser({ email: "typesense-indexer-test@test.com" });
    seededUserId = user.id;
  });

  afterAll(async () => {
    await queueService.obliterateQueue(
      QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE,
    );
    await queueEvents.close();
  });

  function makeSampleDoc(
    overrides: Partial<UserProfileDocument> = {},
  ): UserProfileDocument & { correlationId: string } {
    return {
      id: String(seededUserId),
      userId: seededUserId,
      jobTypes: ["full-time", "contract"],
      compensationTypes: ["paid"],
      workScheduleDays: ["monday", "tuesday", "wednesday"],
      scheduleTypes: ["flexible"],
      workArrangements: ["remote", "hybrid"],
      commuteTime: "up_to_30_minutes",
      willingnessToRelocate: "willing_domestically",
      volunteerHoursPerWeek: null,
      workAreas: ["Engineering", "Design"],
      updatedAt: Date.now(),
      correlationId: `test-${Date.now()}`,
      ...overrides,
    };
  }

  it("indexes a user profile document via the queue", async () => {
    const doc = makeSampleDoc();

    const job = await queueService.addJob(
      QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE,
      "indexUserProfile",
      doc,
    );

    await waitForJobFinished(job);

    const indexed = await typesenseClient
      .collections(USER_PROFILES_COLLECTION)
      .documents(String(seededUserId))
      .retrieve();

    expect(indexed).toMatchObject({
      id: String(seededUserId),
      userId: seededUserId,
      jobTypes: ["full-time", "contract"],
      compensationTypes: ["paid"],
      workArrangements: ["remote", "hybrid"],
      workAreas: ["Engineering", "Design"],
    });
  });

  it("upserts on repeated save — no duplicate documents", async () => {
    const updatedDoc = makeSampleDoc({
      jobTypes: ["part-time"],
      workAreas: ["Engineering", "Design", "Marketing"],
      updatedAt: Date.now(),
    });

    const job = await queueService.addJob(
      QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE,
      "updateUserProfile",
      updatedDoc,
    );

    await waitForJobFinished(job);

    const indexed = await typesenseClient
      .collections(USER_PROFILES_COLLECTION)
      .documents(String(seededUserId))
      .retrieve();

    expect(indexed).toMatchObject({
      id: String(seededUserId),
      jobTypes: ["part-time"],
      workAreas: ["Engineering", "Design", "Marketing"],
    });
  });

  it("deletes a user profile document via the queue", async () => {
    // Ensure there is a document to delete (prior tests may have left one,
    // but be explicit so this test is self-contained)
    await typesenseUserProfileService.upsertUserProfile(makeSampleDoc());

    const job = await queueService.addJob(
      QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE,
      "deleteUserProfile",
      makeSampleDoc(),
    );

    await waitForJobFinished(job);

    await expect(
      typesenseClient
        .collections(USER_PROFILES_COLLECTION)
        .documents(String(seededUserId))
        .retrieve(),
    ).rejects.toThrow();
  });
});
