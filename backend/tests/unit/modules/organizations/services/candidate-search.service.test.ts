import { describe, it, expect, vi, beforeEach } from "vitest";

import { CandidateSearchService } from "@/modules/organizations/services/candidate-search.service";
import type {
  ProfileDocument,
  SearchProfilesResult,
  TypesenseProfileServicePort,
} from "@shared/ports/typesense-profile-service.port";
import type { SearchCandidatesSchema } from "@/validations/candidate-search.validation";

// ─── Helpers ────────────────────────────────────────────────────────────

function createMockTypesenseProfileService(): TypesenseProfileServicePort {
  return {
    upsertProfile: vi.fn(),
    deleteProfile: vi.fn(),
    searchProfilesCollection: vi.fn(),
    indexManyProfileDocuments: vi.fn(),
  };
}

function makeDoc(overrides: Partial<ProfileDocument> = {}): ProfileDocument {
  return {
    id: "42",
    userId: 42,
    name: "Jane Doe",
    photoUrl: "https://cdn.example.com/avatar.png",
    headline: "Senior Software Engineer",
    skills: ["TypeScript", "React"],
    location: "Austin, TX, USA",
    yearsOfExperience: 6,
    openToWork: true,
    isProfilePublic: true,
    intent: "seeker",
    updatedAt: 1_700_000_000,
    ...overrides,
  };
}

function makeSearchResult(
  docs: ProfileDocument[],
  found?: number,
  page = 1,
): SearchProfilesResult {
  return { hits: docs, found: found ?? docs.length, page };
}

function makeFilters(
  overrides: Partial<SearchCandidatesSchema["query"]> = {},
): SearchCandidatesSchema["query"] {
  return {
    skills: [],
    page: 1,
    limit: 20,
    sortBy: "relevant",
    sortOrder: "desc",
    ...overrides,
  } as SearchCandidatesSchema["query"];
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe("CandidateSearchService", () => {
  let service: CandidateSearchService;
  let typesenseProfileService: TypesenseProfileServicePort;

  beforeEach(() => {
    typesenseProfileService = createMockTypesenseProfileService();
    service = new CandidateSearchService(typesenseProfileService);

    // Default stub so every test has a valid response unless overridden.
    vi.mocked(
      typesenseProfileService.searchProfilesCollection,
    ).mockResolvedValue(makeSearchResult([]));
  });

  // ── Defense-in-depth filters (must always be present) ────────────────

  describe("defense-in-depth filters", () => {
    it("always applies isProfilePublic:true filter", async () => {
      await service.searchCandidates(makeFilters());

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).toContain("isProfilePublic:true");
    });

    it("always applies intent:seeker filter", async () => {
      await service.searchCandidates(makeFilters());

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).toContain("intent:seeker");
    });

    it("keeps isProfilePublic and intent filters even when every optional filter is provided", async () => {
      await service.searchCandidates(
        makeFilters({
          skills: ["react"],
          location: "Austin, TX, USA",
          minYearsExperience: 3,
          openToWork: true,
        }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).toContain("isProfilePublic:true");
      expect(call.filterBy).toContain("intent:seeker");
    });
  });

  // ── Skills (query text, not filter) ──────────────────────────────────

  describe("skills handling", () => {
    it("uses joined skills as q with queryBy='skills', prefix=false, numTypos=0", async () => {
      await service.searchCandidates(
        makeFilters({ skills: ["react", "typescript"] }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.q).toBe("react typescript");
      expect(call.queryBy).toBe("skills");
      expect(call.prefix).toBe(false);
      expect(call.numTypos).toBe(0);
    });

    it("does NOT add a skills:* filter — skills drive relevance, not filtering", async () => {
      await service.searchCandidates(
        makeFilters({ skills: ["react", "typescript"] }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).not.toContain("skills:");
    });

    it("falls back to q='*' (match-all) when skills is empty", async () => {
      await service.searchCandidates(makeFilters({ skills: [] }));

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.q).toBe("*");
    });
  });

  // ── Optional filters ─────────────────────────────────────────────────

  describe("optional filters", () => {
    it("adds location filter when provided", async () => {
      await service.searchCandidates(
        makeFilters({ location: "Austin, TX, USA" }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).toContain("location:Austin, TX, USA");
    });

    it("omits location filter when not provided", async () => {
      await service.searchCandidates(makeFilters({ location: undefined }));

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).not.toContain("location:");
    });

    it("adds openToWork:true filter when provided", async () => {
      await service.searchCandidates(makeFilters({ openToWork: true }));

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).toContain("openToWork:true");
    });

    it("adds openToWork:false filter when explicitly false", async () => {
      await service.searchCandidates(makeFilters({ openToWork: false }));

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).toContain("openToWork:false");
    });

    it("omits openToWork filter when undefined", async () => {
      await service.searchCandidates(makeFilters({ openToWork: undefined }));

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).not.toContain("openToWork:");
    });

    it("adds minYearsExperience as a >= range filter when provided", async () => {
      await service.searchCandidates(makeFilters({ minYearsExperience: 5 }));

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).toContain("yearsOfExperience:>=5");
    });

    it("still adds minYearsExperience:>=0 when value is 0 (explicit entry-level filter)", async () => {
      await service.searchCandidates(makeFilters({ minYearsExperience: 0 }));

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).toContain("yearsOfExperience:>=0");
    });

    it("omits minYearsExperience filter when undefined", async () => {
      await service.searchCandidates(
        makeFilters({ minYearsExperience: undefined }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.filterBy).not.toContain("yearsOfExperience:");
    });
  });

  // ── Pagination ───────────────────────────────────────────────────────

  describe("pagination", () => {
    it("passes page and limit through to Typesense as page/perPage", async () => {
      await service.searchCandidates(makeFilters({ page: 3, limit: 50 }));

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.page).toBe(3);
      expect(call.perPage).toBe(50);
    });

    it("returns pagination metadata built from the Typesense response", async () => {
      vi.mocked(
        typesenseProfileService.searchProfilesCollection,
      ).mockResolvedValue(makeSearchResult([makeDoc()], 45, 2));

      const result = await service.searchCandidates(
        makeFilters({ page: 2, limit: 20 }),
      );

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.pagination).toEqual({
          total: 45,
          page: 2,
          limit: 20,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true,
          nextPage: 3,
          previousPage: 1,
        });
      }
    });
  });

  // ── Sort resolution ──────────────────────────────────────────────────

  describe("sort resolution", () => {
    it("passes sortBy=undefined when sortBy='relevant' with skills (Typesense default text-match ranking)", async () => {
      await service.searchCandidates(
        makeFilters({ sortBy: "relevant", skills: ["react"] }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.sortBy).toBeUndefined();
    });

    it("falls back to 'updatedAt:desc' when sortBy='relevant' without skills", async () => {
      await service.searchCandidates(
        makeFilters({ sortBy: "relevant", skills: [] }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.sortBy).toBe("updatedAt:desc");
    });

    it("maps sortBy='recent' to 'updatedAt:desc'", async () => {
      await service.searchCandidates(makeFilters({ sortBy: "recent" }));

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.sortBy).toBe("updatedAt:desc");
    });

    it("maps sortBy='name' to 'name:asc' by default", async () => {
      await service.searchCandidates(
        makeFilters({ sortBy: "name", sortOrder: undefined }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.sortBy).toBe("name:asc");
    });

    it("maps sortBy='yearsOfExperience' to 'yearsOfExperience:desc' by default", async () => {
      await service.searchCandidates(
        makeFilters({ sortBy: "yearsOfExperience", sortOrder: undefined }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.sortBy).toBe("yearsOfExperience:desc");
    });

    it("honours an explicit sortOrder override on 'name'", async () => {
      await service.searchCandidates(
        makeFilters({ sortBy: "name", sortOrder: "desc" }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.sortBy).toBe("name:desc");
    });

    it("honours an explicit sortOrder override on 'yearsOfExperience'", async () => {
      await service.searchCandidates(
        makeFilters({ sortBy: "yearsOfExperience", sortOrder: "asc" }),
      );

      const call = vi.mocked(typesenseProfileService.searchProfilesCollection)
        .mock.calls[0]![0];
      expect(call.sortBy).toBe("yearsOfExperience:asc");
    });
  });

  // ── Projection ───────────────────────────────────────────────────────

  describe("projection to CandidatePreview", () => {
    it("strips filter-only fields (isProfilePublic, intent, updatedAt, id) from each hit", async () => {
      vi.mocked(
        typesenseProfileService.searchProfilesCollection,
      ).mockResolvedValue(makeSearchResult([makeDoc()]));

      const result = await service.searchCandidates(makeFilters());

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const item = result.value.items[0]!;
        expect(item).not.toHaveProperty("id");
        expect(item).not.toHaveProperty("isProfilePublic");
        expect(item).not.toHaveProperty("intent");
        expect(item).not.toHaveProperty("updatedAt");
      }
    });

    it("preserves the allowlisted preview fields", async () => {
      vi.mocked(
        typesenseProfileService.searchProfilesCollection,
      ).mockResolvedValue(makeSearchResult([makeDoc()]));

      const result = await service.searchCandidates(makeFilters());

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.items[0]).toEqual({
          userId: 42,
          name: "Jane Doe",
          photoUrl: "https://cdn.example.com/avatar.png",
          headline: "Senior Software Engineer",
          skills: ["TypeScript", "React"],
          location: "Austin, TX, USA",
          yearsOfExperience: 6,
          openToWork: true,
        });
      }
    });

    it("maps missing photoUrl to null", async () => {
      vi.mocked(
        typesenseProfileService.searchProfilesCollection,
      ).mockResolvedValue(makeSearchResult([makeDoc({ photoUrl: undefined })]));

      const result = await service.searchCandidates(makeFilters());

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.items[0]!.photoUrl).toBeNull();
      }
    });

    it("returns an empty items array when Typesense returns no hits", async () => {
      vi.mocked(
        typesenseProfileService.searchProfilesCollection,
      ).mockResolvedValue(makeSearchResult([]));

      const result = await service.searchCandidates(makeFilters());

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.items).toEqual([]);
        expect(result.value.pagination.total).toBe(0);
      }
    });
  });

  // ── Error path ───────────────────────────────────────────────────────

  describe("error handling", () => {
    it("returns a failure Result when Typesense throws", async () => {
      vi.mocked(
        typesenseProfileService.searchProfilesCollection,
      ).mockRejectedValue(new Error("Typesense connection refused"));

      const result = await service.searchCandidates(makeFilters());

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toBe("Failed to search candidates");
      }
    });
  });
});
