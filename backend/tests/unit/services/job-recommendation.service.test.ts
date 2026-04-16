import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SearchResponse } from "typesense/lib/Typesense/Documents";

import { JobRecommendationService } from "@/modules/job-board/services/job-recommendation.service";
import type { TypesenseJobServicePort } from "@shared/ports/typesense-service.port";
import type { UserRecommendationProfilePort } from "@/modules/job-board/ports/user-recommendation-profile.port";
import type { RecommendationProfile } from "@/modules/job-board/ports/user-recommendation-profile.port";
import type { JobDocumentType } from "@/validations/base.validation";

// ─── Helpers ────────────────────────────────────────────────────────────

function createMockTypesenseService(): TypesenseJobServicePort {
  return {
    indexJobDocument: vi.fn(),
    indexManyJobDocuments: vi.fn(),
    retrieveJobDocumentById: vi.fn(),
    upsertJobDocument: vi.fn(),
    deleteJobDocumentById: vi.fn(),
    deleteJobDocumentByTitle: vi.fn(),
    searchJobsCollection: vi.fn(),
    searchJobsForAlert: vi.fn(),
    searchJobsForRecommendations: vi.fn(),
  };
}

function createMockProfilePort(): UserRecommendationProfilePort {
  return {
    getRecommendationProfile: vi.fn(),
  };
}

function makeJobDoc(overrides: Partial<JobDocumentType> = {}): JobDocumentType {
  return {
    id: "1",
    title: "Software Engineer",
    company: "Acme Corp",
    description: "Build things",
    city: "Austin",
    state: "TX",
    country: "USA",
    isRemote: false,
    experience: "mid",
    jobType: "full-time",
    skills: ["TypeScript", "React"],
    createdAt: Math.floor(Date.now() / 1000),
    compensationType: "paid",
    ...overrides,
  };
}

function makeSearchResponse(
  docs: JobDocumentType[],
  found?: number,
): SearchResponse<JobDocumentType> {
  return {
    found: found ?? docs.length,
    hits: docs.map((doc, i) => ({
      document: doc,
      highlight: {},
      highlights: [],
      text_match: 100 - i * 10,
      text_match_info: makeTextMatchInfo(String(100 - i * 10)),
    })),
    out_of: found ?? docs.length,
    page: 1,
    request_params: { q: "", collection_name: "jobs" },
    search_cutoff: false,
    search_time_ms: 5,
  } as unknown as SearchResponse<JobDocumentType>;
}

function makeTextMatchInfo(score: string, fieldsMatched = 1) {
  return {
    best_field_score: score as `${number}`,
    best_field_weight: 1,
    fields_matched: fieldsMatched,
    score: score as `${number}`,
    tokens_matched: 1,
  };
}

const FULL_PROFILE: RecommendationProfile = {
  skills: ["React", "Node.js", "TypeScript"],
  location: { city: "Austin", state: "TX", country: "USA" },
  jobTypes: ["full-time", "part-time"],
  compensationTypes: ["paid"],
};

const SKILLS_ONLY_PROFILE: RecommendationProfile = {
  skills: ["React", "Node.js"],
  location: null,
  jobTypes: null,
  compensationTypes: null,
};

const PREFERENCES_ONLY_PROFILE: RecommendationProfile = {
  skills: [],
  location: { city: "Denver", state: "CO", country: "USA" },
  jobTypes: ["contract"],
  compensationTypes: ["missionary"],
};

const EMPTY_PROFILE: RecommendationProfile = {
  skills: [],
  location: null,
  jobTypes: null,
  compensationTypes: null,
};

// ─── Tests ──────────────────────────────────────────────────────────────

describe("JobRecommendationService", () => {
  let service: JobRecommendationService;
  let typesenseService: TypesenseJobServicePort;
  let profilePort: UserRecommendationProfilePort;

  beforeEach(() => {
    typesenseService = createMockTypesenseService();
    profilePort = createMockProfilePort();
    service = new JobRecommendationService(typesenseService, profilePort);
  });

  // ── hasPersonalization flag ──────────────────────────────────────────

  describe("hasPersonalization flag", () => {
    it("should return true when user has skills", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        SKILLS_ONLY_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.hasPersonalization).toBe(true);
      }
    });

    it("should return true when user has preferences (jobTypes)", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        PREFERENCES_ONLY_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.hasPersonalization).toBe(true);
      }
    });

    it("should return true when user has both skills and preferences", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        FULL_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.hasPersonalization).toBe(true);
      }
    });

    it("should return false when profile is empty (no skills, no preferences)", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        EMPTY_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.hasPersonalization).toBe(false);
      }
    });

    it("should return false when profile is null (no user/profile row)", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(null);
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.hasPersonalization).toBe(false);
      }
    });
  });

  // ── Graceful degradation tiers ───────────────────────────────────────

  describe("graceful degradation tiers", () => {
    it("full profile: uses skills as search query with all filters", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        FULL_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([makeJobDoc()]));

      await service.getRecommendations(1, 1, 10);

      expect(
        typesenseService.searchJobsForRecommendations,
      ).toHaveBeenCalledWith(
        "React Node.js TypeScript",
        expect.stringContaining("isActive:true"),
        expect.objectContaining({ page: 1, limit: 10 }),
      );

      // Verify filters include jobType, compensationType, and location
      const filters = vi.mocked(typesenseService.searchJobsForRecommendations)
        .mock.calls[0]![1];
      expect(filters).toContain("jobType:[full-time, part-time]");
      expect(filters).toContain("compensationType:[paid]");
      expect(filters).toContain("city:Austin");
      expect(filters).toContain("state:TX");
      expect(filters).toContain("country:USA");
    });

    it("skills only: uses skills as query with isActive filter only", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        SKILLS_ONLY_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      expect(
        typesenseService.searchJobsForRecommendations,
      ).toHaveBeenCalledWith(
        "React Node.js",
        "isActive:true",
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it("preferences + location, no skills: uses '*' query with filters and createdAt sort", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        PREFERENCES_ONLY_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      expect(
        typesenseService.searchJobsForRecommendations,
      ).toHaveBeenCalledWith(
        "*",
        expect.stringContaining("isActive:true"),
        expect.objectContaining({
          sortBy: "createdAt",
          sortDirection: "desc",
          page: 1,
          limit: 10,
        }),
      );

      const filters = vi.mocked(typesenseService.searchJobsForRecommendations)
        .mock.calls[0]![1];
      expect(filters).toContain("jobType:[contract]");
      expect(filters).toContain("compensationType:[missionary]");
    });

    it("empty profile: uses '*' query with isActive filter and createdAt sort", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        EMPTY_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      expect(
        typesenseService.searchJobsForRecommendations,
      ).toHaveBeenCalledWith(
        "*",
        "isActive:true",
        expect.objectContaining({
          sortBy: "createdAt",
          sortDirection: "desc",
        }),
      );
    });

    it("null profile (no user row): uses '*' query with isActive and createdAt sort", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(null);
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      expect(
        typesenseService.searchJobsForRecommendations,
      ).toHaveBeenCalledWith(
        "*",
        "isActive:true",
        expect.objectContaining({
          sortBy: "createdAt",
          sortDirection: "desc",
        }),
      );
    });
  });

  // ── Filter building ──────────────────────────────────────────────────

  describe("filter building", () => {
    it("should include location with remote fallback when profile has location", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        FULL_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      const filters = vi.mocked(typesenseService.searchJobsForRecommendations)
        .mock.calls[0]![1];
      // Location filters include remote fallback (addLocationFilters with includeRemote=true)
      expect(filters).toContain("isRemote:true");
    });

    it("should not include jobType filter when jobTypes is null", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue({
        ...FULL_PROFILE,
        jobTypes: null,
      });
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      const filters = vi.mocked(typesenseService.searchJobsForRecommendations)
        .mock.calls[0]![1];
      expect(filters).not.toContain("jobType:");
    });

    it("should not include jobType filter when jobTypes is empty array", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue({
        ...FULL_PROFILE,
        jobTypes: [],
      });
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      const filters = vi.mocked(typesenseService.searchJobsForRecommendations)
        .mock.calls[0]![1];
      expect(filters).not.toContain("jobType:");
    });

    it("should not include compensationType filter when compensationTypes is null", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue({
        ...FULL_PROFILE,
        compensationTypes: null,
      });
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      const filters = vi.mocked(typesenseService.searchJobsForRecommendations)
        .mock.calls[0]![1];
      expect(filters).not.toContain("compensationType:");
    });

    it("should not include location filter when location is null", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue({
        ...FULL_PROFILE,
        location: null,
      });
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      const filters = vi.mocked(typesenseService.searchJobsForRecommendations)
        .mock.calls[0]![1];
      expect(filters).not.toContain("city:");
      expect(filters).not.toContain("state:");
      expect(filters).not.toContain("country:");
    });

    it("should skip location filter when all location fields are empty", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue({
        ...FULL_PROFILE,
        location: { city: "", state: "", country: "" },
      });
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 1, 10);

      const filters = vi.mocked(typesenseService.searchJobsForRecommendations)
        .mock.calls[0]![1];
      expect(filters).not.toContain("city:");
      expect(filters).not.toContain("isRemote:");
    });
  });

  // ── Scoring calculation ──────────────────────────────────────────────

  describe("scoring calculation", () => {
    it("should assign matchScore of 0 when using wildcard query (no skills)", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        EMPTY_PROFILE,
      );

      const doc = makeJobDoc();
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([doc]));

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.jobs[0]!.matchScore).toBe(0);
      }
    });

    it("should compute composite score (70% relevance + 30% recency) when skills present", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        SKILLS_ONLY_PROFILE,
      );

      const now = Math.floor(Date.now() / 1000);
      const doc = makeJobDoc({ createdAt: now }); // just created

      const response = makeSearchResponse([doc]);
      // Set a known text_match_info score
      response.hits![0]!.text_match_info = makeTextMatchInfo("50", 2);

      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(response);

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const job = result.value.jobs[0]!;
        // relevanceScore = 50, recencyScore ≈ 1 (just created)
        // matchScore = 50 * 0.7 + 1 * 100 * 0.3 = 35 + 30 = 65
        expect(job.matchScore).toBeCloseTo(65, 0);
      }
    });

    it("should give lower recency score to older jobs", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        SKILLS_ONLY_PROFILE,
      );

      const now = Math.floor(Date.now() / 1000);
      const fifteenDaysAgo = now - 15 * 24 * 60 * 60; // half of maxAge (30 days)
      const recentDoc = makeJobDoc({ id: "1", createdAt: now });
      const olderDoc = makeJobDoc({ id: "2", createdAt: fifteenDaysAgo });

      const response = makeSearchResponse([recentDoc, olderDoc]);
      // Same text relevance for both
      response.hits![0]!.text_match_info = makeTextMatchInfo("50", 2);
      response.hits![1]!.text_match_info = makeTextMatchInfo("50", 2);

      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(response);

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const [first, second] = result.value.jobs;
        expect(first!.matchScore).toBeGreaterThan(second!.matchScore);
      }
    });

    it("should clamp recency score to 0 for jobs older than 30 days", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        SKILLS_ONLY_PROFILE,
      );

      const now = Math.floor(Date.now() / 1000);
      const fortyDaysAgo = now - 40 * 24 * 60 * 60;
      const doc = makeJobDoc({ createdAt: fortyDaysAgo });

      const response = makeSearchResponse([doc]);
      response.hits![0]!.text_match_info = makeTextMatchInfo("100", 2);

      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(response);

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        // matchScore = 100 * 0.7 + 0 * 100 * 0.3 = 70
        expect(result.value.jobs[0]!.matchScore).toBeCloseTo(70, 0);
      }
    });

    it("should sort jobs by matchScore descending when skills present", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        SKILLS_ONLY_PROFILE,
      );

      const now = Math.floor(Date.now() / 1000);
      const lowRelevanceDoc = makeJobDoc({ id: "1", createdAt: now });
      const highRelevanceDoc = makeJobDoc({ id: "2", createdAt: now });

      const response = makeSearchResponse([lowRelevanceDoc, highRelevanceDoc]);
      response.hits![0]!.text_match_info = makeTextMatchInfo("10", 1);
      response.hits![1]!.text_match_info = makeTextMatchInfo("90", 3);

      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(response);

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const [first, second] = result.value.jobs;
        expect(first!.matchScore).toBeGreaterThan(second!.matchScore);
        expect(first!.id).toBe("2"); // high relevance doc sorted first
      }
    });

    it("should handle missing text_match_info gracefully", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        SKILLS_ONLY_PROFILE,
      );

      const doc = makeJobDoc({ createdAt: Math.floor(Date.now() / 1000) });
      const response = makeSearchResponse([doc]);
      // Remove text_match_info to test fallback
      response.hits![0]!.text_match_info = undefined as any;

      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(response);

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        // relevanceScore falls back to 0, so score is 0 * 0.7 + recency * 30
        expect(result.value.jobs[0]!.matchScore).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── Empty results ────────────────────────────────────────────────────

  describe("empty results", () => {
    it("should return empty jobs array when no hits", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        FULL_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.jobs).toEqual([]);
        expect(result.value.total).toBe(0);
      }
    });

    it("should return empty jobs when hits is undefined", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        FULL_PROFILE,
      );

      const response = makeSearchResponse([]);
      response.hits = undefined as any;

      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(response);

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.jobs).toEqual([]);
      }
    });
  });

  // ── Pagination pass-through ──────────────────────────────────────────

  describe("pagination", () => {
    it("should pass page and limit to Typesense search", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        FULL_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([]));

      await service.getRecommendations(1, 3, 20);

      expect(
        typesenseService.searchJobsForRecommendations,
      ).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ page: 3, limit: 20 }),
      );
    });

    it("should return total from Typesense response", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        FULL_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockResolvedValue(makeSearchResponse([makeJobDoc()], 42));

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.total).toBe(42);
      }
    });
  });

  // ── Error handling ───────────────────────────────────────────────────

  describe("error handling", () => {
    it("should return failure when profile port throws", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockRejectedValue(
        new Error("DB connection lost"),
      );

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toBe(
          "Failed to fetch job recommendations",
        );
      }
    });

    it("should return failure when Typesense search throws", async () => {
      vi.mocked(profilePort.getRecommendationProfile).mockResolvedValue(
        FULL_PROFILE,
      );
      vi.mocked(
        typesenseService.searchJobsForRecommendations,
      ).mockRejectedValue(new Error("Typesense unavailable"));

      const result = await service.getRecommendations(1, 1, 10);

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toBe(
          "Failed to fetch job recommendations",
        );
      }
    });
  });
});
