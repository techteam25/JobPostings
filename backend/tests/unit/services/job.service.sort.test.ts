import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JobService } from "@/services/job.service";
import { TypesenseService } from "@/infrastructure/typesense.service/typesense.service";
import type { SearchResponse } from "typesense/lib/Typesense/Documents";
import type { JobDocumentType } from "@/validations/base.validation";

// Mock dependencies
vi.mock("@/infrastructure/typesense.service/typesense.service");
vi.mock("@/repositories/job.repository");
vi.mock("@/repositories/organization.repository");
vi.mock("@/repositories/jobInsights.repository");
vi.mock("@/repositories/user.repository");
vi.mock("@/infrastructure/queue.service");

describe("JobService - Sort Parameter Logic", () => {
  let jobService: JobService;
  let mockTypesenseService: TypesenseService;

  beforeEach(() => {
    jobService = new JobService();
    mockTypesenseService = (jobService as any).typesenseService;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Default Sort Logic", () => {
    it("should default to 'relevance' when search query exists and no sortBy specified", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        q: "software engineer",
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        "software engineer",
        expect.any(String),
        expect.objectContaining({
          limit: 10,
          offset: 0,
          page: 1,
          sortBy: "relevance",
          sortDirection: "desc",
        }),
      );
    });

    it("should default to 'date_posted_desc' when no search query and no sortBy specified", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        undefined,
        expect.any(String),
        expect.objectContaining({
          limit: 10,
          offset: 0,
          page: 1,
          sortBy: "date",
          sortDirection: "desc",
        }),
      );
    });

    it("should default to 'date_posted_desc' when empty search query and no sortBy specified", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        q: "",
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        "",
        expect.any(String),
        expect.objectContaining({
          sortBy: "date",
          sortDirection: "desc",
        }),
      );
    });

    it("should default to 'date_posted_desc' when whitespace-only search query and no sortBy", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        q: "   ",
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        "   ",
        expect.any(String),
        expect.objectContaining({
          sortBy: "date",
          sortDirection: "desc",
        }),
      );
    });
  });

  describe("Explicit Sort Parameter Override", () => {
    it("should use explicit sortBy 'date_posted_desc' even when search query exists", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        q: "software engineer",
        sortBy: "date_posted_desc",
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        "software engineer",
        expect.any(String),
        expect.objectContaining({
          sortBy: "date",
          sortDirection: "desc",
        }),
      );
    });

    it("should use explicit sortBy 'relevance' even when no search query", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        sortBy: "relevance",
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        undefined,
        expect.any(String),
        expect.objectContaining({
          sortBy: "relevance",
          sortDirection: "desc",
        }),
      );
    });

    it("should use explicit sortBy 'title_asc' when provided", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        q: "engineer",
        sortBy: "title_asc",
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        "engineer",
        expect.any(String),
        expect.objectContaining({
          sortBy: "title",
          sortDirection: "asc",
        }),
      );
    });
  });

  describe("Sort Value Mapping to Typesense Format", () => {
    const testCases = [
      {
        input: "date_posted_desc",
        expectedSortBy: "date",
        expectedDirection: "desc",
        description: "should map 'date_posted_desc' to sortBy='date', sortDirection='desc'",
      },
      {
        input: "date_posted_asc",
        expectedSortBy: "date",
        expectedDirection: "asc",
        description: "should map 'date_posted_asc' to sortBy='date', sortDirection='asc'",
      },
      {
        input: "title_asc",
        expectedSortBy: "title",
        expectedDirection: "asc",
        description: "should map 'title_asc' to sortBy='title', sortDirection='asc'",
      },
      {
        input: "title_desc",
        expectedSortBy: "title",
        expectedDirection: "desc",
        description: "should map 'title_desc' to sortBy='title', sortDirection='desc'",
      },
      {
        input: "relevance",
        expectedSortBy: "relevance",
        expectedDirection: "desc",
        description: "should map 'relevance' to sortBy='relevance', sortDirection='desc'",
      },
    ];

    testCases.forEach(({ input, expectedSortBy, expectedDirection, description }) => {
      it(description, async () => {
        const mockSearchResponse: SearchResponse<JobDocumentType> = {
          found: 0,
          hits: [],
          out_of: 0,
          page: 1,
          request_params: { per_page: 10 },
          search_time_ms: 10,
        };

        vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
          mockSearchResponse,
        );

        await jobService.searchJobs({
          sortBy: input as any,
          page: 1,
          limit: 10,
        });

        expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
          undefined,
          expect.any(String),
          expect.objectContaining({
            sortBy: expectedSortBy,
            sortDirection: expectedDirection,
          }),
        );
      });
    });
  });

  describe("Relevance Sorting with Search Query", () => {
    it("should use relevance (no sort_by) when search query exists and sortBy is 'relevance'", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 1,
        hits: [
          {
            document: {
              id: "1",
              title: "Senior Software Engineer",
              company: "Tech Corp",
              description: "Software engineering role",
              isRemote: false,
              status: "open",
              jobType: "full-time",
              skills: ["JavaScript"],
              createdAt: Math.floor(Date.now() / 1000),
            },
            text_match: 100,
            text_match_info: {
              best_field_score: "100",
              best_field_weight: 1,
              fields_matched: 2,
              score: "95.5",
              tokens_matched: 2,
            },
            highlight: {} as any,
          },
        ],
        out_of: 1,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      const result = await jobService.searchJobs({
        q: "software engineer",
        sortBy: "relevance",
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        "software engineer",
        expect.any(String),
        expect.objectContaining({
          sortBy: "relevance",
          sortDirection: "desc",
        }),
      );

      expect(result.isSuccess).toBe(true);
    });

    it("should use relevance by default when search query exists", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        q: "developer",
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        "developer",
        expect.any(String),
        expect.objectContaining({
          sortBy: "relevance",
          sortDirection: "desc",
        }),
      );
    });
  });

  describe("Date Sorting without Search Query", () => {
    it("should use date_posted_desc by default when no search query", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        city: "San Francisco",
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        undefined,
        expect.any(String),
        expect.objectContaining({
          sortBy: "date",
          sortDirection: "desc",
        }),
      );
    });

    it("should use date_posted_asc when explicitly specified without search query", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        sortBy: "date_posted_asc",
        jobType: ["full-time"],
        page: 1,
        limit: 10,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        undefined,
        expect.any(String),
        expect.objectContaining({
          sortBy: "date",
          sortDirection: "asc",
        }),
      );
    });
  });

  describe("Sort with Multiple Filters", () => {
    it("should apply sort along with location filters", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        city: "Austin",
        state: "TX",
        sortBy: "title_asc",
        page: 1,
        limit: 10,
      });

      const call = (mockTypesenseService.searchJobsCollection as any).mock.calls[0];
      
      expect(call[1]).toContain("city:Austin");
      expect(call[1]).toContain("state:TX");
      expect(call[2]).toMatchObject({
        sortBy: "title",
        sortDirection: "asc",
      });
    });

    it("should apply sort along with skills filters", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 10 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        skills: ["React", "TypeScript"],
        sortBy: "date_posted_desc",
        page: 1,
        limit: 10,
      });

      const call = (mockTypesenseService.searchJobsCollection as any).mock.calls[0];
      
      expect(call[1]).toContain("skills:");
      expect(call[2]).toMatchObject({
        sortBy: "date",
        sortDirection: "desc",
      });
    });

    it("should apply sort with pagination parameters", async () => {
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 2,
        request_params: { per_page: 20 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsCollection").mockResolvedValue(
        mockSearchResponse,
      );

      await jobService.searchJobs({
        sortBy: "title_desc",
        page: 2,
        limit: 20,
      });

      expect(mockTypesenseService.searchJobsCollection).toHaveBeenCalledWith(
        undefined,
        expect.any(String),
        expect.objectContaining({
          sortBy: "title",
          sortDirection: "desc",
          page: 2,
          limit: 20,
          offset: 20,
        }),
      );
    });
  });
});