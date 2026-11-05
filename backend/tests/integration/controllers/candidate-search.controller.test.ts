import { typesenseClient } from "@shared/config/typesense-client";
import { PROFILES_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import { TypesenseProfileService } from "@shared/infrastructure/typesense.service/typesense-profile.service";
import { request } from "@tests/utils/testHelpers";
import {
  seedAdminScenario,
  seedUserScenario,
} from "@tests/utils/seedScenarios";
import type { ProfileDocument } from "@shared/ports/typesense-profile-service.port";

// The global queue mock in setupTests.ts is fine — this suite drives Typesense
// documents directly via TypesenseProfileService, so no BullMQ worker is needed.

const BASE_URL = "/api/organizations/candidates/search";

const typesenseProfileService = new TypesenseProfileService();

// ─── Helpers ────────────────────────────────────────────────────────────

async function recreateProfilesCollection(): Promise<void> {
  try {
    await typesenseClient.collections(PROFILES_COLLECTION).delete();
  } catch {
    // Collection may not exist yet — ignore.
  }

  await typesenseClient.collections().create({
    name: PROFILES_COLLECTION,
    fields: [
      { name: "id", type: "string" },
      { name: "userId", type: "int64" },
      { name: "name", type: "string" },
      { name: "photoUrl", type: "string", optional: true },
      { name: "headline", type: "string" },
      { name: "skills", type: "string[]", facet: true },
      { name: "location", type: "string", facet: true },
      { name: "yearsOfExperience", type: "int32" },
      { name: "openToWork", type: "bool", facet: true },
      { name: "isProfilePublic", type: "bool", facet: true },
      { name: "intent", type: "string", facet: true },
      { name: "updatedAt", type: "int64" },
    ],
    default_sorting_field: "updatedAt",
  });
}

function makeDoc(overrides: Partial<ProfileDocument> = {}): ProfileDocument {
  const userId = overrides.userId ?? 1001;
  return {
    id: String(userId),
    userId,
    name: "Jane Doe",
    photoUrl: "https://cdn.example.com/avatar.png",
    headline: "Senior Engineer",
    skills: ["TypeScript", "React"],
    location: "Austin, TX, USA",
    yearsOfExperience: 6,
    openToWork: true,
    isProfilePublic: true,
    intent: "seeker",
    updatedAt: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

/**
 * Seeded candidate documents. Lives in Typesense (not MySQL) so the global
 * `cleanAll` beforeEach hook does not wipe it between tests.
 */
const SEED_DOCS: ProfileDocument[] = [
  makeDoc({
    userId: 1001,
    name: "Alice React",
    skills: ["react", "typescript"],
    location: "Austin, TX, USA",
    yearsOfExperience: 7,
    openToWork: true,
  }),
  makeDoc({
    userId: 1002,
    name: "Bob Node",
    skills: ["node", "typescript"],
    location: "Denver, CO, USA",
    yearsOfExperience: 3,
    openToWork: true,
  }),
  makeDoc({
    userId: 1003,
    name: "Charlie Junior",
    skills: ["react"],
    location: "Seattle, WA, USA",
    yearsOfExperience: 1,
    openToWork: false,
  }),
  makeDoc({
    userId: 1004,
    name: "Private Pete",
    skills: ["react", "typescript"],
    location: "Austin, TX, USA",
    yearsOfExperience: 10,
    isProfilePublic: false, // must NEVER appear in results
  }),
  makeDoc({
    userId: 1005,
    name: "Employer Eve",
    skills: ["react"],
    location: "Austin, TX, USA",
    yearsOfExperience: 5,
    intent: "employer", // must NEVER appear in results
  }),
];

async function signInAsEmployer(): Promise<string> {
  await seedAdminScenario();
  const res = await request
    .post("/api/auth/sign-in/email")
    .send({ email: "admin.user@example.com", password: "Password@123" });
  return res.headers["set-cookie"]![0]!;
}

async function signInAsNonEmployer(): Promise<string> {
  await seedUserScenario();
  const res = await request
    .post("/api/auth/sign-in/email")
    .send({ email: "normal.user@example.com", password: "Password@123" });
  return res.headers["set-cookie"]![0]!;
}

describe("Candidate Search Integration Tests", () => {
  vi.setConfig({ testTimeout: 30_000 });

  let employerCookie: string;

  // Recreate the Typesense collection once for the whole suite — cleanAll
  // only touches MySQL + Redis, so documents persist across tests.
  beforeAll(async () => {
    await recreateProfilesCollection();
    await typesenseProfileService.indexManyProfileDocuments(SEED_DOCS);
    // Brief settle so the index is queryable before the first test.
    await new Promise((r) => setTimeout(r, 500));
  });

  afterAll(async () => {
    try {
      await typesenseClient.collections(PROFILES_COLLECTION).delete();
    } catch {
      // Ignore cleanup errors
    }
  });

  // Global setupTests.ts runs cleanAll before each test (wiping users +
  // sessions), so we re-seed + re-sign-in before each test too.
  beforeEach(async () => {
    employerCookie = await signInAsEmployer();
  });

  describe("authentication & authorization", () => {
    it("returns 401 when unauthenticated", async () => {
      const response = await request.get(BASE_URL).expect(401);

      expect(response.body).toHaveProperty("success", false);
    });

    it("returns 403 when authenticated but user has no job-posting role", async () => {
      // Note: seedAdminScenario already ran in the outer beforeEach — that
      // created admin.user@example.com. We add the plain user on top and
      // sign in as THEM, so the cleanAll doesn't interfere.
      const nonEmployerCookie = await signInAsNonEmployer();
      const response = await request
        .get(BASE_URL)
        .set("Cookie", nonEmployerCookie)
        .expect(403);

      expect(response.body).toHaveProperty("success", false);
    });

    it("returns 200 for an authenticated employer (org owner)", async () => {
      const response = await request
        .get(BASE_URL)
        .set("Cookie", employerCookie)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("basic search", () => {
    it("returns all public seeker profiles when no filters applied", async () => {
      const response = await request
        .get(BASE_URL)
        .set("Cookie", employerCookie)
        .expect(200);

      expect(response.body.data.length).toBe(3); // Alice, Bob, Charlie
      expect(response.body).toHaveProperty("pagination");
    });

    it("never returns private profiles (isProfilePublic=false)", async () => {
      const response = await request
        .get(BASE_URL)
        .set("Cookie", employerCookie)
        .expect(200);

      const userIds = response.body.data.map(
        (c: { userId: number }) => c.userId,
      );
      expect(userIds).not.toContain(1004); // Private Pete
    });

    it("never returns employer-intent profiles", async () => {
      const response = await request
        .get(BASE_URL)
        .set("Cookie", employerCookie)
        .expect(200);

      const userIds = response.body.data.map(
        (c: { userId: number }) => c.userId,
      );
      expect(userIds).not.toContain(1005); // Employer Eve
    });

    it("strips internal fields (isProfilePublic, intent, updatedAt, id) from the response payload", async () => {
      const response = await request
        .get(BASE_URL)
        .set("Cookie", employerCookie)
        .expect(200);

      for (const item of response.body.data) {
        expect(item).not.toHaveProperty("id");
        expect(item).not.toHaveProperty("isProfilePublic");
        expect(item).not.toHaveProperty("intent");
        expect(item).not.toHaveProperty("updatedAt");
      }
    });
  });

  describe("skills filter (relevance-based)", () => {
    it("returns profiles whose skills match the query terms", async () => {
      const response = await request
        .get(BASE_URL)
        .query({ skills: ["react"] })
        .set("Cookie", employerCookie)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      for (const item of response.body.data) {
        expect(item.skills.map((s: string) => s.toLowerCase())).toContain(
          "react",
        );
      }
    });

    it("returns zero results when no seeker has any of the queried skills", async () => {
      const response = await request
        .get(BASE_URL)
        .query({ skills: ["fortran"] })
        .set("Cookie", employerCookie)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe("location filter", () => {
    it("returns only seekers matching the given location", async () => {
      const response = await request
        .get(BASE_URL)
        .query({ location: "Austin, TX, USA" })
        .set("Cookie", employerCookie)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      for (const item of response.body.data) {
        expect(item.location).toBe("Austin, TX, USA");
      }
    });
  });

  describe("minYearsExperience filter", () => {
    it("excludes candidates below the minimum experience threshold", async () => {
      const response = await request
        .get(BASE_URL)
        .query({ minYearsExperience: 5 })
        .set("Cookie", employerCookie)
        .expect(200);

      for (const item of response.body.data) {
        expect(item.yearsOfExperience).toBeGreaterThanOrEqual(5);
      }
    });

    it("returns everyone when threshold is 0", async () => {
      const response = await request
        .get(BASE_URL)
        .query({ minYearsExperience: 0 })
        .set("Cookie", employerCookie)
        .expect(200);

      expect(response.body.data.length).toBe(3);
    });
  });

  describe("openToWork filter", () => {
    it("returns only candidates open to work when openToWork=true", async () => {
      const response = await request
        .get(BASE_URL)
        .query({ openToWork: true })
        .set("Cookie", employerCookie)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      for (const item of response.body.data) {
        expect(item.openToWork).toBe(true);
      }
    });

    // Note: `openToWork=false` over the wire arrives as the string "false",
    // which `z.coerce.boolean()` coerces to `true` (non-empty string →
    // truthy). So there is no integration-level path to filter for
    // openToWork:false via this endpoint today. The unit test covers the
    // service layer honouring the literal boolean.
  });

  describe("combined filters", () => {
    it("narrows results when skills + location + experience are combined", async () => {
      const response = await request
        .get(BASE_URL)
        .query({
          skills: ["react"],
          location: "Austin, TX, USA",
          minYearsExperience: 5,
        })
        .set("Cookie", employerCookie)
        .expect(200);

      for (const item of response.body.data) {
        expect(item.location).toBe("Austin, TX, USA");
        expect(item.yearsOfExperience).toBeGreaterThanOrEqual(5);
        expect(item.skills.map((s: string) => s.toLowerCase())).toContain(
          "react",
        );
      }
    });
  });

  describe("pagination", () => {
    it("respects limit and returns pagination metadata", async () => {
      const response = await request
        .get(BASE_URL)
        .query({ limit: 2 })
        .set("Cookie", employerCookie)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
      });
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(
        response.body.data.length,
      );
    });

    it("returns subsequent pages via the page param", async () => {
      const page1 = await request
        .get(BASE_URL)
        .query({ limit: 1, page: 1 })
        .set("Cookie", employerCookie)
        .expect(200);
      const page2 = await request
        .get(BASE_URL)
        .query({ limit: 1, page: 2 })
        .set("Cookie", employerCookie)
        .expect(200);

      expect(page1.body.data.length).toBe(1);
      expect(page2.body.data.length).toBe(1);
      expect(page1.body.data[0].userId).not.toBe(page2.body.data[0].userId);
    });
  });

  describe("sorting", () => {
    it("sorts by yearsOfExperience descending by default", async () => {
      const response = await request
        .get(BASE_URL)
        .query({ sortBy: "yearsOfExperience" })
        .set("Cookie", employerCookie)
        .expect(200);

      const years = response.body.data.map(
        (c: { yearsOfExperience: number }) => c.yearsOfExperience,
      );
      for (let i = 0; i < years.length - 1; i++) {
        expect(years[i]).toBeGreaterThanOrEqual(years[i + 1]);
      }
    });

    it("sorts by yearsOfExperience ascending when sortOrder=asc", async () => {
      const response = await request
        .get(BASE_URL)
        .query({ sortBy: "yearsOfExperience", sortOrder: "asc" })
        .set("Cookie", employerCookie)
        .expect(200);

      const years = response.body.data.map(
        (c: { yearsOfExperience: number }) => c.yearsOfExperience,
      );
      for (let i = 0; i < years.length - 1; i++) {
        expect(years[i]).toBeLessThanOrEqual(years[i + 1]);
      }
    });
  });

  describe("validation errors", () => {
    it("rejects an invalid sortBy value (400)", async () => {
      await request
        .get(BASE_URL)
        .query({ sortBy: "popularity" })
        .set("Cookie", employerCookie)
        .expect(400);
    });

    it("rejects page < 1 (400)", async () => {
      await request
        .get(BASE_URL)
        .query({ page: 0 })
        .set("Cookie", employerCookie)
        .expect(400);
    });

    it("rejects limit > 100 (400)", async () => {
      await request
        .get(BASE_URL)
        .query({ limit: 500 })
        .set("Cookie", employerCookie)
        .expect(400);
    });

    it("rejects minYearsExperience out of bounds (400)", async () => {
      await request
        .get(BASE_URL)
        .query({ minYearsExperience: 999 })
        .set("Cookie", employerCookie)
        .expect(400);
    });

    it("rejects unknown query params (strict schema) (400)", async () => {
      await request
        .get(BASE_URL)
        .query({ unexpectedParam: "value" })
        .set("Cookie", employerCookie)
        .expect(400);
    });
  });
});
