import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobBoardToApplicationsAdapter } from "@shared/adapters/job-board-to-applications.adapter";

describe("JobBoardToApplicationsAdapter", () => {
  let adapter: JobBoardToApplicationsAdapter;
  let mockJobBoardRepository: any;

  const mockJobData = {
    job: {
      id: 10,
      title: "Software Engineer",
      isActive: true,
      applicationDeadline: "2026-06-01T00:00:00.000Z",
      employerId: 5,
    },
    employer: {
      id: 5,
      name: "Acme Corp",
      city: "New York",
      state: "NY",
      logoUrl: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockJobBoardRepository = {
      findJobById: vi.fn(),
    };

    adapter = new JobBoardToApplicationsAdapter(mockJobBoardRepository);
  });

  describe("getJobForApplication", () => {
    it("should return job data mapped to JobForApplication shape", async () => {
      mockJobBoardRepository.findJobById.mockResolvedValue(mockJobData);

      const result = await adapter.getJobForApplication(10);

      expect(result).toEqual({
        id: 10,
        title: "Software Engineer",
        isActive: true,
        applicationDeadline: new Date("2026-06-01T00:00:00.000Z"),
        employerId: 5,
      });
      expect(mockJobBoardRepository.findJobById).toHaveBeenCalledWith(10);
    });

    it("should return null when job does not exist", async () => {
      mockJobBoardRepository.findJobById.mockResolvedValue(null);

      const result = await adapter.getJobForApplication(999);

      expect(result).toBeNull();
    });

    it("should return null when job data has no job property", async () => {
      mockJobBoardRepository.findJobById.mockResolvedValue({ job: null });

      const result = await adapter.getJobForApplication(10);

      expect(result).toBeNull();
    });

    it("should handle null applicationDeadline", async () => {
      mockJobBoardRepository.findJobById.mockResolvedValue({
        ...mockJobData,
        job: { ...mockJobData.job, applicationDeadline: null },
      });

      const result = await adapter.getJobForApplication(10);

      expect(result).not.toBeNull();
      expect(result!.applicationDeadline).toBeNull();
    });
  });

  describe("getJobWithEmployerId", () => {
    it("should return employer ID data mapped to JobWithEmployerId shape", async () => {
      mockJobBoardRepository.findJobById.mockResolvedValue(mockJobData);

      const result = await adapter.getJobWithEmployerId(10);

      expect(result).toEqual({
        jobId: 10,
        employerId: 5,
        employerOrgId: 5,
      });
    });

    it("should return null when job does not exist", async () => {
      mockJobBoardRepository.findJobById.mockResolvedValue(null);

      const result = await adapter.getJobWithEmployerId(999);

      expect(result).toBeNull();
    });

    it("should fall back to job.employerId when employer is null", async () => {
      mockJobBoardRepository.findJobById.mockResolvedValue({
        job: mockJobData.job,
        employer: null,
      });

      const result = await adapter.getJobWithEmployerId(10);

      expect(result).toEqual({
        jobId: 10,
        employerId: 5,
        employerOrgId: 5,
      });
    });
  });

  describe("doesJobExist", () => {
    it("should return true when job exists", async () => {
      mockJobBoardRepository.findJobById.mockResolvedValue(mockJobData);

      const result = await adapter.doesJobExist(10);

      expect(result).toBe(true);
    });

    it("should return false when job does not exist", async () => {
      mockJobBoardRepository.findJobById.mockResolvedValue(null);

      const result = await adapter.doesJobExist(999);

      expect(result).toBe(false);
    });
  });
});
