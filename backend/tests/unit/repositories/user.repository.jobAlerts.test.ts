import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

vi.mock("@/db/connection", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    query: {
      jobAlerts: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));

import { db } from "@/db/connection";
import { UserRepository } from "@/repositories/user.repository";
import { DatabaseError } from "@/utils/errors";

describe("UserRepository - Job Alerts", () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    vi.clearAllMocks();
  });

  describe("canCreateJobAlert", () => {
    it("should return canCreate=true when user has less than 10 alerts", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      };
      (db.select as Mock).mockReturnValue(mockSelect);

      const result = await userRepository.canCreateJobAlert(1);

      expect(result).toEqual({
        canCreate: true,
        currentCount: 5,
        maxAllowed: 10,
      });
    });

    it("should return canCreate=false when user has 10 active alerts", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 10 }]),
      };
      (db.select as Mock).mockReturnValue(mockSelect);

      const result = await userRepository.canCreateJobAlert(1);

      expect(result).toEqual({
        canCreate: false,
        currentCount: 10,
        maxAllowed: 10,
      });
    });

    it("should handle zero alerts", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };
      (db.select as Mock).mockReturnValue(mockSelect);

      const result = await userRepository.canCreateJobAlert(1);

      expect(result).toEqual({
        canCreate: true,
        currentCount: 0,
        maxAllowed: 10,
      });
    });
  });

  describe("createJobAlert", () => {
    it("should create a job alert successfully", async () => {
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
      };
      (db.insert as Mock).mockReturnValue(mockInsert);

      const mockAlert = {
        id: 1,
        userId: 1,
        name: "Test Alert",
        description: "Test description",
        searchQuery: "developer",
        state: null,
        city: null,
        jobType: null,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly",
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (db.query.jobAlerts.findFirst as Mock).mockResolvedValue(mockAlert);

      const alertData = {
        name: "Test Alert",
        description: "Test description",
        searchQuery: "developer",
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        userId: 1,
      };

      const result = await userRepository.createJobAlert(1, alertData);

      expect(result).toEqual(mockAlert);
      expect(mockInsert.values).toHaveBeenCalledWith({
        ...alertData,
        userId: 1,
      });
    });

    it("should throw DatabaseError if created alert not found", async () => {
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
      };
      (db.insert as Mock).mockReturnValue(mockInsert);
      (db.query.jobAlerts.findFirst as Mock).mockResolvedValue(undefined);

      const alertData = {
        name: "Test Alert",
        description: "Test description",
        searchQuery: "developer",
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly" as const,
        userId: 1,
      };

      // noinspection ES6RedundantAwait
      await expect(() =>
        userRepository.createJobAlert(1, alertData),
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe("getUserJobAlerts", () => {
    it("should return paginated job alerts", async () => {
      const mockAlerts = [
        {
          id: 1,
          name: "Alert 1",
          userId: 1,
          description: "Test",
          searchQuery: "test",
          state: null,
          city: null,
          jobType: null,
          skills: null,
          experienceLevel: null,
          isActive: true,
          isPaused: false,
          includeRemote: true,
          frequency: "weekly",
          lastSentAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Alert 2",
          userId: 1,
          description: "Test",
          searchQuery: "test",
          state: null,
          city: null,
          jobType: null,
          skills: null,
          experienceLevel: null,
          isActive: true,
          isPaused: false,
          includeRemote: true,
          frequency: "weekly",
          lastSentAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 15 }]),
      };
      (db.select as Mock).mockReturnValue(mockSelect);
      (db.query.jobAlerts.findMany as Mock).mockResolvedValue(mockAlerts);

      const result = await userRepository.getUserJobAlerts(1, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual(mockAlerts);
      expect(result.pagination).toEqual({
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
        nextPage: 2,
        previousPage: null,
      });
    });

    it("should handle empty results", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 0 }]),
      };
      (db.select as Mock).mockReturnValue(mockSelect);
      (db.query.jobAlerts.findMany as Mock).mockResolvedValue([]);

      const result = await userRepository.getUserJobAlerts(1, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe("getJobAlertById", () => {
    it("should return job alert when found", async () => {
      const mockAlert = {
        id: 1,
        name: "Test Alert",
        userId: 1,
        description: "Test",
        searchQuery: "test",
        state: null,
        city: null,
        jobType: null,
        skills: null,
        experienceLevel: null,
        isActive: true,
        isPaused: false,
        includeRemote: true,
        frequency: "weekly",
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (db.query.jobAlerts.findFirst as Mock).mockResolvedValue(mockAlert);

      const result = await userRepository.getJobAlertById(1, 1);

      expect(result).toEqual(mockAlert);
    });

    it("should return undefined when alert not found", async () => {
      (db.query.jobAlerts.findFirst as Mock).mockResolvedValue(undefined);

      const result = await userRepository.getJobAlertById(1, 999);

      expect(result).toBeUndefined();
    });

    it("should only return alerts belonging to the user", async () => {
      (db.query.jobAlerts.findFirst as Mock).mockResolvedValue(undefined);

      const result = await userRepository.getJobAlertById(1, 1);

      expect(result).toBeUndefined();
    });
  });
});
