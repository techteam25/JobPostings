import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "@/services/user.service";
import { UserRepository } from "@/repositories/user.repository";
import {
  ValidationError,
  DatabaseError,
  NotFoundError,
} from "@/utils/errors";

vi.mock("@/repositories/user.repository", () => ({
  UserRepository: vi.fn(),
}));
vi.mock("@/repositories/organization.repository", () => ({
  OrganizationRepository: vi.fn(),
}));
vi.mock("@/infrastructure/email.service", () => ({
  EmailService: vi.fn(),
}));
vi.mock("@/infrastructure/queue.service", () => ({
  queueService: {},
  QUEUE_NAMES: {},
}));

describe("UserService - Job Alerts", () => {
  let userService: UserService;
  let mockUserRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
    mockUserRepository = UserRepository.prototype;
  });

  describe("createJobAlert", () => {
    const alertData = {
      name: "Test Alert",
      description: "Test description",
      searchQuery: "developer",
      isActive: true,
      isPaused: false,
      includeRemote: true,
      frequency: "weekly" as const,
    };

    it("should create job alert when user has less than 10 alerts", async () => {
      mockUserRepository.canCreateJobAlert = vi.fn().mockResolvedValue({
        canCreate: true,
        currentCount: 5,
        maxAllowed: 10,
      });

      const mockAlert = {
        id: 1,
        userId: 1,
        ...alertData,
        state: null,
        city: null,
        jobType: null,
        skills: null,
        experienceLevel: null,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserRepository.createJobAlert = vi.fn().mockResolvedValue(mockAlert);

      const result = await userService.createJobAlert(1, alertData);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockAlert);
      }
      expect(mockUserRepository.canCreateJobAlert).toHaveBeenCalledWith(1);
      expect(mockUserRepository.createJobAlert).toHaveBeenCalledWith(
        1,
        alertData,
      );
    });

    it("should fail when user has reached alert limit", async () => {
      mockUserRepository.canCreateJobAlert = vi.fn().mockResolvedValue({
        canCreate: false,
        currentCount: 10,
        maxAllowed: 10,
      });

      const result = await userService.createJobAlert(1, alertData);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Maximum active job alerts");
      }
      expect(mockUserRepository.createJobAlert).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockUserRepository.canCreateJobAlert = vi.fn().mockResolvedValue({
        canCreate: true,
        currentCount: 5,
        maxAllowed: 10,
      });
      mockUserRepository.createJobAlert = vi
        .fn()
        .mockRejectedValue(new Error("DB Error"));

      const result = await userService.createJobAlert(1, alertData);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("getUserJobAlerts", () => {
    it("should return paginated job alerts", async () => {
      const mockResult = {
        items: [
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
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
          nextPage: null,
          previousPage: null,
        },
      };

      mockUserRepository.getUserJobAlerts = vi
        .fn()
        .mockResolvedValue(mockResult);

      const result = await userService.getUserJobAlerts(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockResult);
      }
      expect(mockUserRepository.getUserJobAlerts).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
      });
    });

    it("should handle database errors", async () => {
      mockUserRepository.getUserJobAlerts = vi
        .fn()
        .mockRejectedValue(new Error("DB Error"));

      const result = await userService.getUserJobAlerts(1, 1, 10);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(DatabaseError);
      }
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
      mockUserRepository.getJobAlertById = vi.fn().mockResolvedValue(mockAlert);

      const result = await userService.getJobAlertById(1, 1);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockAlert);
      }
      expect(mockUserRepository.getJobAlertById).toHaveBeenCalledWith(1, 1);
    });

    it("should fail when alert not found", async () => {
      mockUserRepository.getJobAlertById = vi.fn().mockResolvedValue(undefined);

      const result = await userService.getJobAlertById(1, 999);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should handle database errors", async () => {
      mockUserRepository.getJobAlertById = vi
        .fn()
        .mockRejectedValue(new Error("DB Error"));

      const result = await userService.getJobAlertById(1, 1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
