import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JobMatchingService } from "@/services/job-matching.service";
import { TypesenseService } from "@/infrastructure/typesense.service/typesense.service";
import type { SearchResponse } from "typesense/lib/Typesense/Documents";
import type { JobDocumentType } from "@/validations/base.validation";

// Mock dependencies
vi.mock("@/infrastructure/typesense.service/typesense.service");
vi.mock("@/repositories/job.repository");
vi.mock("@/repositories/user.repository");

describe("JobMatchingService - Alert Matching Logic", () => {
  let jobMatchingService: JobMatchingService;
  let mockTypesenseService: TypesenseService;

  beforeEach(() => {
    jobMatchingService = new JobMatchingService();
    mockTypesenseService = (jobMatchingService as any).typesenseService;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("findMatchingJobsForAlert - Single Criteria", () => {
    it("should build correct filter for city only", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: "Seattle",
        state: null,
        searchQuery: null,
        jobType: null,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockResolvedValue(
        mockSearchResponse,
      );

      await jobMatchingService.findMatchingJobsForAlert(alert, 50);

      expect(mockTypesenseService.searchJobsForAlert).toHaveBeenCalledWith(
        null,
        expect.stringContaining("city:Seattle"),
        null,
        50,
      );
    });

    it("should build correct filter for state only", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: null,
        state: "California",
        searchQuery: null,
        jobType: null,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockResolvedValue(
        mockSearchResponse,
      );

      await jobMatchingService.findMatchingJobsForAlert(alert, 50);

      expect(mockTypesenseService.searchJobsForAlert).toHaveBeenCalledWith(
        null,
        expect.stringContaining("state:California"),
        null,
        50,
      );
    });

    it("should include remote fallback for location filters", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: "Seattle",
        state: "Washington",
        searchQuery: null,
        jobType: null,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockResolvedValue(
        mockSearchResponse,
      );

      await jobMatchingService.findMatchingJobsForAlert(alert, 50);

      const filterCall = (mockTypesenseService.searchJobsForAlert as any).mock
        .calls[0][1];
      expect(filterCall).toContain("isRemote:true");
    });

    it("should build correct filter for skills", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: null,
        state: null,
        searchQuery: null,
        jobType: null,
        skills: ["JavaScript", "React"],
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockResolvedValue(
        mockSearchResponse,
      );

      await jobMatchingService.findMatchingJobsForAlert(alert, 50);

      const filterCall = (mockTypesenseService.searchJobsForAlert as any).mock
        .calls[0][1];
      expect(filterCall).toContain("skills:");
    });
  });

  describe("findMatchingJobsForAlert - Multiple Criteria", () => {
    it("should combine all criteria with AND logic", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: "Seattle",
        state: "Washington",
        searchQuery: "software engineer",
        jobType: ["full_time", "contract"] as any,
        skills: ["JavaScript", "React"],
        experienceLevel: ["mid"],
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockResolvedValue(
        mockSearchResponse,
      );

      await jobMatchingService.findMatchingJobsForAlert(alert, 50);

      const filterCall = (mockTypesenseService.searchJobsForAlert as any).mock
        .calls[0][1];

      // Check that filters are combined with &&
      expect(filterCall.split(" && ").length).toBeGreaterThan(1);

      // Verify all criteria are present
      expect(filterCall).toContain("city:Seattle");
      expect(filterCall).toContain("state:Washington");
      expect(filterCall).toContain("experience:[mid]");
    });

    it("should normalize jobType from underscores to hyphens", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: null,
        state: null,
        searchQuery: "test",
        jobType: ["full_time", "part_time"] as any,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockResolvedValue(
        mockSearchResponse,
      );

      await jobMatchingService.findMatchingJobsForAlert(alert, 50);

      const filterCall = (mockTypesenseService.searchJobsForAlert as any).mock
        .calls[0][1];

      // Should have hyphens, not underscores
      expect(filterCall).toContain("full-time");
      expect(filterCall).toContain("part-time");
      expect(filterCall).not.toContain("full_time");
    });
  });

  describe("findMatchingJobsForAlert - Scoring Logic", () => {
    it("should calculate composite score with relevance and recency", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: null,
        state: null,
        searchQuery: "test",
        jobType: null,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      const nowTimestamp = Math.floor(Date.now() / 1000);

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 2,
        hits: [
          {
            document: {
              id: "1",
              title: "Test Job",
              company: "Test Company",
              description: "Test description",
              isRemote: false,
              status: "open",
              jobType: "full-time",
              skills: ["test"],
              createdAt: nowTimestamp - 86400, // 1 day old
            },
            text_match: 100,
            text_match_info: {
              best_field_score: "100",
              best_field_weight: 1,
              fields_matched: 1,
              score: "85.5",
              tokens_matched: 1,
            },
            highlight: {} as any,
          },
        ],
        out_of: 2,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockResolvedValue(
        mockSearchResponse,
      );

      const result = await jobMatchingService.findMatchingJobsForAlert(
        alert,
        50,
      );

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.length).toBe(1);
        expect(result.value[0]?.matchScore).toBeGreaterThan(0);
        // Score should be combination of relevance (85.5 * 0.7) and recency (high for 1 day old)
        expect(result.value[0]?.matchScore).toBeGreaterThan(50);
      }
    });

    it("should sort matches by score descending", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: null,
        state: null,
        searchQuery: "test",
        jobType: null,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      const nowTimestamp = Math.floor(Date.now() / 1000);

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 3,
        hits: [
          {
            document: {
              id: "1",
              title: "Job 1",
              company: "Company 1",
              description: "Description 1",
              isRemote: false,
              status: "open",
              jobType: "full-time",
              skills: ["test"],
              createdAt: nowTimestamp - 86400,
            },
            text_match: 100,
            text_match_info: {
              best_field_score: "100",
              best_field_weight: 1,
              fields_matched: 1,
              score: "50",
              tokens_matched: 1,
            },
            highlight: {} as any,
          },
          {
            document: {
              id: "2",
              title: "Job 2",
              company: "Company 2",
              description: "Description 2",
              isRemote: false,
              status: "open",
              jobType: "full-time",
              skills: ["test"],
              createdAt: nowTimestamp - 86400,
            },
            text_match: 100,
            text_match_info: {
              best_field_score: "100",
              best_field_weight: 1,
              fields_matched: 1,
              score: "90",
              tokens_matched: 1,
            },
            highlight: {} as any,
          },
          {
            document: {
              id: "3",
              title: "Job 3",
              company: "Company 3",
              description: "Description 3",
              isRemote: false,
              status: "open",
              jobType: "full-time",
              skills: ["test"],
              createdAt: nowTimestamp - 86400,
            },
            text_match: 100,
            text_match_info: {
              best_field_score: "100",
              best_field_weight: 1,
              fields_matched: 1,
              score: "70",
              tokens_matched: 1,
            },
            highlight: {} as any,
          },
        ],
        out_of: 3,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockResolvedValue(
        mockSearchResponse,
      );

      const result = await jobMatchingService.findMatchingJobsForAlert(
        alert,
        50,
      );

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.length).toBe(3);
        // Scores should be descending
        expect(result.value[0]?.matchScore).toBeGreaterThanOrEqual(
          result.value[1]!.matchScore,
        );
        expect(result.value[1]?.matchScore).toBeGreaterThanOrEqual(
          result.value[2]!.matchScore,
        );
      }
    });

    it("should handle zero results gracefully", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: null,
        state: null,
        searchQuery: "very rare search term xyz123",
        jobType: null,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 10,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockResolvedValue(
        mockSearchResponse,
      );

      const result = await jobMatchingService.findMatchingJobsForAlert(
        alert,
        50,
      );

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe("findMatchingJobsForAlert - Error Handling", () => {
    it("should handle Typesense errors gracefully", async () => {
      const alert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test",
        city: null,
        state: null,
        searchQuery: "test",
        jobType: null,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };

      vi.spyOn(mockTypesenseService, "searchJobsForAlert").mockRejectedValue(
        new Error("Typesense connection failed"),
      );

      const result = await jobMatchingService.findMatchingJobsForAlert(
        alert,
        50,
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.message).toContain("Failed to find matching jobs");
      }
    });
  });
});
