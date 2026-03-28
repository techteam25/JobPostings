import { typesenseClient } from "@shared/config/typesense-client";
import { USER_PROFILES_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import { TypesenseUserProfileService } from "@shared/infrastructure/typesense.service/typesense-user-profile.service";
import { createTypesenseUserProfileIndexerWorker } from "@/modules/user-profile/workers/typesense-user-profile-indexer.worker";
import type { UserProfileDocument } from "@shared/ports/typesense-user-profile-service.port";

// Override the global queue mock — this test needs real Redis queue + Typesense
vi.mock("@shared/infrastructure/queue.service", async (importOriginal) => {
  return await importOriginal();
});

const typesenseUserProfileService = new TypesenseUserProfileService();

async function waitForUserProfileIndexing(
  userId: string,
  timeout = 5000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      reject(
        new Error(
          `User profile indexing timed out after ${timeout}ms for userId ${userId}`,
        ),
      );
    }, timeout);

    const checkInterval = setInterval(async () => {
      try {
        const document = await typesenseClient
          .collections(USER_PROFILES_COLLECTION)
          .documents(userId)
          .retrieve();

        if (document) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          resolve();
        }
      } catch (error: any) {
        if (error.httpStatus === 404) {
          // Not found yet, keep waiting
        } else {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          reject(error);
        }
      }
    }, 300);
  });
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

  beforeAll(async () => {
    await queueService.initialize();
    const worker = createTypesenseUserProfileIndexerWorker({
      typesenseUserProfileService,
    });
    worker.initialize();

    await cleanTypesenseCollection();
  });

  afterAll(async () => {
    await queueService.obliterateQueue(
      QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE,
    );
  });

  const sampleDoc: UserProfileDocument & { correlationId: string } = {
    id: "100",
    userId: 100,
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
    correlationId: "test-correlation-1",
  };

  it("indexes a user profile document via the queue", async () => {
    await queueService.addJob(
      QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE,
      "indexUserProfile",
      sampleDoc,
    );

    await waitForUserProfileIndexing("100");

    const doc = await typesenseClient
      .collections(USER_PROFILES_COLLECTION)
      .documents("100")
      .retrieve();

    expect(doc).toMatchObject({
      id: "100",
      userId: 100,
      jobTypes: ["full-time", "contract"],
      compensationTypes: ["paid"],
      workArrangements: ["remote", "hybrid"],
      workAreas: ["Engineering", "Design"],
    });
  });

  it("upserts on repeated save — no duplicate documents", async () => {
    const updatedDoc = {
      ...sampleDoc,
      jobTypes: ["part-time"],
      workAreas: ["Engineering", "Design", "Marketing"],
      updatedAt: Date.now(),
      correlationId: "test-correlation-2",
    };

    await queueService.addJob(
      QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE,
      "updateUserProfile",
      updatedDoc,
    );

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const doc = await typesenseClient
      .collections(USER_PROFILES_COLLECTION)
      .documents("100")
      .retrieve();

    expect(doc).toMatchObject({
      id: "100",
      jobTypes: ["part-time"],
      workAreas: ["Engineering", "Design", "Marketing"],
    });
  });

  it("deletes a user profile document via the queue", async () => {
    await queueService.addJob(
      QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE,
      "deleteUserProfile",
      { ...sampleDoc, correlationId: "test-correlation-3" },
    );

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await expect(
      typesenseClient
        .collections(USER_PROFILES_COLLECTION)
        .documents("100")
        .retrieve(),
    ).rejects.toThrow();
  });
});
