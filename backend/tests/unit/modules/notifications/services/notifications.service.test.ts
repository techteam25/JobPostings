import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationsService } from "@/modules/notifications/services/notifications.service";
import { ValidationError, DatabaseError, NotFoundError } from "@shared/errors";

describe("NotificationsService - Job Alerts", () => {
  let notificationsService: NotificationsService;
  let mockNotificationsRepository: any;
  let mockEmailService: any;
  let mockGetUserById: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNotificationsRepository = {
      canCreateJobAlert: vi.fn(),
      createJobAlert: vi.fn(),
      getUserJobAlerts: vi.fn(),
      getJobAlertById: vi.fn(),
      deleteJobAlert: vi.fn(),
      updateJobAlert: vi.fn(),
      updateJobAlertPauseState: vi.fn(),
      findEmailPreferencesByUserId: vi.fn(),
      findEmailPreferencesByToken: vi.fn(),
      createEmailPreferences: vi.fn(),
      updateEmailPreferences: vi.fn(),
      refreshUnsubscribeToken: vi.fn(),
      canSendEmailType: vi.fn(),
      logPreferenceChange: vi.fn(),
      getUserAuditHistory: vi.fn(),
      setEmployerEmailPreferences: vi.fn(),
      unsubscribeByContext: vi.fn(),
      resubscribeByContext: vi.fn(),
      getAlertsForProcessing: vi.fn(),
      updateAlertLastSentAt: vi.fn(),
      saveAlertMatches: vi.fn(),
      getUnsentMatches: vi.fn(),
      markMatchesAsSent: vi.fn(),
      getUnsentMatchCount: vi.fn(),
      pauseAlertsForInactiveUsers: vi.fn(),
    };

    mockEmailService = {
      sendUnsubscribeConfirmation: vi.fn(),
    };

    mockGetUserById = vi.fn().mockResolvedValue(null);

    notificationsService = new NotificationsService(
      mockNotificationsRepository,
      mockEmailService,
      mockGetUserById,
    );
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
      mockNotificationsRepository.canCreateJobAlert.mockResolvedValue({
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
      mockNotificationsRepository.createJobAlert.mockResolvedValue(mockAlert);

      const result = await notificationsService.createJobAlert(1, alertData);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockAlert);
      }
      expect(
        mockNotificationsRepository.canCreateJobAlert,
      ).toHaveBeenCalledWith(1);
      expect(mockNotificationsRepository.createJobAlert).toHaveBeenCalledWith(
        1,
        alertData,
      );
    });

    it("should fail when user has reached alert limit", async () => {
      mockNotificationsRepository.canCreateJobAlert.mockResolvedValue({
        canCreate: false,
        currentCount: 10,
        maxAllowed: 10,
      });

      const result = await notificationsService.createJobAlert(1, alertData);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Maximum active job alerts");
      }
      expect(mockNotificationsRepository.createJobAlert).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockNotificationsRepository.canCreateJobAlert.mockResolvedValue({
        canCreate: true,
        currentCount: 5,
        maxAllowed: 10,
      });
      mockNotificationsRepository.createJobAlert.mockRejectedValue(
        new Error("DB Error"),
      );

      const result = await notificationsService.createJobAlert(1, alertData);

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
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
          nextPage: null,
          previousPage: null,
        },
      };

      mockNotificationsRepository.getUserJobAlerts.mockResolvedValue(
        mockResult,
      );

      const result = await notificationsService.getUserJobAlerts(1, 1, 10);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockResult);
      }
      expect(mockNotificationsRepository.getUserJobAlerts).toHaveBeenCalledWith(
        1,
        { page: 1, limit: 10 },
      );
    });

    it("should handle database errors", async () => {
      mockNotificationsRepository.getUserJobAlerts.mockRejectedValue(
        new Error("DB Error"),
      );

      const result = await notificationsService.getUserJobAlerts(1, 1, 10);

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
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(mockAlert);

      const result = await notificationsService.getJobAlertById(1, 1);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockAlert);
      }
      expect(mockNotificationsRepository.getJobAlertById).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it("should fail when alert not found", async () => {
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(undefined);

      const result = await notificationsService.getJobAlertById(1, 999);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should handle database errors", async () => {
      mockNotificationsRepository.getJobAlertById.mockRejectedValue(
        new Error("DB Error"),
      );

      const result = await notificationsService.getJobAlertById(1, 1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("updateJobAlert - frequency change scheduling", () => {
    const baseAlert = {
      id: 1,
      userId: 1,
      name: "Test Alert",
      description: "Test",
      searchQuery: "developer",
      state: null,
      city: null,
      jobType: null,
      skills: null,
      experienceLevel: null,
      isActive: true,
      isPaused: false,
      includeRemote: true,
      frequency: "weekly" as const,
      lastSentAt: new Date("2026-02-01T08:00:00Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should set lastSentAt to null when switching to more frequent (weekly -> daily)", async () => {
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(baseAlert);
      mockNotificationsRepository.updateJobAlert.mockResolvedValue({
        ...baseAlert,
        frequency: "daily",
        lastSentAt: null,
      });

      await notificationsService.updateJobAlert(1, 1, {
        frequency: "daily",
      });

      expect(mockNotificationsRepository.updateJobAlert).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ frequency: "daily", lastSentAt: null }),
      );
    });

    it("should set lastSentAt to null when switching monthly -> daily", async () => {
      const monthlyAlert = { ...baseAlert, frequency: "monthly" as const };
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(
        monthlyAlert,
      );
      mockNotificationsRepository.updateJobAlert.mockResolvedValue({
        ...monthlyAlert,
        frequency: "daily",
        lastSentAt: null,
      });

      await notificationsService.updateJobAlert(1, 1, {
        frequency: "daily",
      });

      expect(mockNotificationsRepository.updateJobAlert).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ frequency: "daily", lastSentAt: null }),
      );
    });

    it("should set lastSentAt to null when switching monthly -> weekly", async () => {
      const monthlyAlert = { ...baseAlert, frequency: "monthly" as const };
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(
        monthlyAlert,
      );
      mockNotificationsRepository.updateJobAlert.mockResolvedValue({
        ...monthlyAlert,
        frequency: "weekly",
        lastSentAt: null,
      });

      await notificationsService.updateJobAlert(1, 1, {
        frequency: "weekly",
      });

      expect(mockNotificationsRepository.updateJobAlert).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ frequency: "weekly", lastSentAt: null }),
      );
    });

    it("should set lastSentAt to now when switching to less frequent (daily -> weekly)", async () => {
      const dailyAlert = { ...baseAlert, frequency: "daily" as const };
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(dailyAlert);
      mockNotificationsRepository.updateJobAlert.mockResolvedValue({
        ...dailyAlert,
        frequency: "weekly",
      });

      const before = new Date();
      await notificationsService.updateJobAlert(1, 1, {
        frequency: "weekly",
      });
      const after = new Date();

      const callArgs =
        mockNotificationsRepository.updateJobAlert.mock.calls[0][2];
      expect(callArgs.frequency).toBe("weekly");
      expect(callArgs.lastSentAt).toBeInstanceOf(Date);
      expect(callArgs.lastSentAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(callArgs.lastSentAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it("should set lastSentAt to now when switching daily -> monthly", async () => {
      const dailyAlert = { ...baseAlert, frequency: "daily" as const };
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(dailyAlert);
      mockNotificationsRepository.updateJobAlert.mockResolvedValue({
        ...dailyAlert,
        frequency: "monthly",
      });

      const before = new Date();
      await notificationsService.updateJobAlert(1, 1, {
        frequency: "monthly",
      });
      const after = new Date();

      const callArgs =
        mockNotificationsRepository.updateJobAlert.mock.calls[0][2];
      expect(callArgs.frequency).toBe("monthly");
      expect(callArgs.lastSentAt).toBeInstanceOf(Date);
      expect(callArgs.lastSentAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(callArgs.lastSentAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it("should set lastSentAt to now when switching weekly -> monthly", async () => {
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(baseAlert);
      mockNotificationsRepository.updateJobAlert.mockResolvedValue({
        ...baseAlert,
        frequency: "monthly",
      });

      const before = new Date();
      await notificationsService.updateJobAlert(1, 1, {
        frequency: "monthly",
      });
      const after = new Date();

      const callArgs =
        mockNotificationsRepository.updateJobAlert.mock.calls[0][2];
      expect(callArgs.frequency).toBe("monthly");
      expect(callArgs.lastSentAt).toBeInstanceOf(Date);
      expect(callArgs.lastSentAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(callArgs.lastSentAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it("should not modify lastSentAt when frequency is unchanged", async () => {
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(baseAlert);
      mockNotificationsRepository.updateJobAlert.mockResolvedValue(baseAlert);

      await notificationsService.updateJobAlert(1, 1, {
        name: "Updated Name",
      });

      const callArgs =
        mockNotificationsRepository.updateJobAlert.mock.calls[0][2];
      expect(callArgs.lastSentAt).toBeUndefined();
    });

    it("should not modify lastSentAt when updating same frequency", async () => {
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(baseAlert);
      mockNotificationsRepository.updateJobAlert.mockResolvedValue(baseAlert);

      await notificationsService.updateJobAlert(1, 1, {
        frequency: "weekly",
      });

      const callArgs =
        mockNotificationsRepository.updateJobAlert.mock.calls[0][2];
      expect(callArgs.lastSentAt).toBeUndefined();
    });
  });

  describe("deleteJobAlert", () => {
    it("should delete job alert when it exists", async () => {
      mockNotificationsRepository.getJobAlertById.mockResolvedValue({
        id: 1,
        userId: 1,
      });
      mockNotificationsRepository.deleteJobAlert.mockResolvedValue(undefined);

      const result = await notificationsService.deleteJobAlert(1, 1);

      expect(result.isSuccess).toBe(true);
      expect(mockNotificationsRepository.deleteJobAlert).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it("should fail when alert not found", async () => {
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(undefined);

      const result = await notificationsService.deleteJobAlert(1, 999);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe("togglePauseJobAlert", () => {
    it("should pause a job alert", async () => {
      const mockAlert = { id: 1, userId: 1, isPaused: false };
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(mockAlert);
      mockNotificationsRepository.updateJobAlertPauseState.mockResolvedValue({
        ...mockAlert,
        isPaused: true,
      });

      const result = await notificationsService.togglePauseJobAlert(1, 1, true);

      expect(result.isSuccess).toBe(true);
      expect(
        mockNotificationsRepository.updateJobAlertPauseState,
      ).toHaveBeenCalledWith(1, 1, true);
    });

    it("should fail when alert not found", async () => {
      mockNotificationsRepository.getJobAlertById.mockResolvedValue(undefined);

      const result = await notificationsService.togglePauseJobAlert(
        1,
        999,
        true,
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });
});
