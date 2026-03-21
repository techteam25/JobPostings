import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationsToJobBoardAdapter } from "@shared/adapters/applications-to-job-board.adapter";

describe("ApplicationsToJobBoardAdapter", () => {
  let adapter: ApplicationsToJobBoardAdapter;
  let mockApplicationsRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockApplicationsRepository = {
      findApplicationsByUser: vi.fn(),
      hasUserAppliedToJob: vi.fn(),
      findApplicationsByJob: vi.fn(),
    };

    adapter = new ApplicationsToJobBoardAdapter(mockApplicationsRepository);
  });

  describe("getAppliedJobIds", () => {
    it("should return empty set when jobIds array is empty", async () => {
      const result = await adapter.getAppliedJobIds(1, []);

      expect(result).toEqual(new Set());
      expect(
        mockApplicationsRepository.findApplicationsByUser,
      ).not.toHaveBeenCalled();
    });

    it("should return set of applied job IDs", async () => {
      mockApplicationsRepository.findApplicationsByUser.mockResolvedValue({
        items: [
          { job: { id: 10 }, application: {} },
          { job: { id: 30 }, application: {} },
        ],
        pagination: {},
      });

      const result = await adapter.getAppliedJobIds(1, [10, 20, 30]);

      expect(result).toEqual(new Set([10, 30]));
      expect(
        mockApplicationsRepository.findApplicationsByUser,
      ).toHaveBeenCalledWith(1, [10, 20, 30]);
    });

    it("should filter out items with undefined job IDs", async () => {
      mockApplicationsRepository.findApplicationsByUser.mockResolvedValue({
        items: [
          { job: { id: 10 }, application: {} },
          { job: undefined, application: {} },
          { application: {} },
        ],
        pagination: {},
      });

      const result = await adapter.getAppliedJobIds(1, [10, 20]);

      expect(result).toEqual(new Set([10]));
    });
  });

  describe("hasUserApplied", () => {
    it("should return true when user has applied", async () => {
      mockApplicationsRepository.hasUserAppliedToJob.mockResolvedValue(true);

      const result = await adapter.hasUserApplied(1, 10);

      expect(result).toBe(true);
      expect(
        mockApplicationsRepository.hasUserAppliedToJob,
      ).toHaveBeenCalledWith(1, 10);
    });

    it("should return false when user has not applied", async () => {
      mockApplicationsRepository.hasUserAppliedToJob.mockResolvedValue(false);

      const result = await adapter.hasUserApplied(1, 10);

      expect(result).toBe(false);
    });
  });

  describe("hasApplicationsForJob", () => {
    it("should return true when job has applications", async () => {
      mockApplicationsRepository.findApplicationsByJob.mockResolvedValue({
        items: [{ id: 1, job: { id: 10 } }],
        pagination: {},
      });

      const result = await adapter.hasApplicationsForJob(10);

      expect(result).toBe(true);
      expect(
        mockApplicationsRepository.findApplicationsByJob,
      ).toHaveBeenCalledWith(10);
    });

    it("should return false when job has no applications", async () => {
      mockApplicationsRepository.findApplicationsByJob.mockResolvedValue({
        items: [],
        pagination: {},
      });

      const result = await adapter.hasApplicationsForJob(10);

      expect(result).toBe(false);
    });
  });
});
