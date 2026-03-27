import { describe, it, expect, vi, beforeEach } from "vitest";
import { PreferenceService } from "@/modules/user-profile/services/preference.service";
import { NotFoundError, ValidationError } from "@shared/errors";
import {
  JobType,
  CompensationType,
  VolunteerHoursPerWeek,
  WorkScheduleDay,
  ScheduleType,
} from "@/modules/user-profile/constants/job-preference.constants";

describe("PreferenceService", () => {
  let service: PreferenceService;
  let mockPreferenceRepo: any;
  let mockProfileRepo: any;

  const mockUserWithProfile = {
    id: 1,
    email: "test@example.com",
    fullName: "Test User",
    profile: { id: 42 },
  };

  const mockPreference = {
    id: 1,
    userProfileId: 42,
    jobTypes: [JobType.FullTime],
    compensationTypes: [CompensationType.Paid],
    volunteerHoursPerWeek: null,
    workScheduleDays: [],
    scheduleTypes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPreferenceRepo = {
      getPreferences: vi.fn(),
      upsertPreferences: vi.fn(),
    };

    mockProfileRepo = {
      findByIdWithProfile: vi.fn(),
    };

    service = new PreferenceService(mockPreferenceRepo, mockProfileRepo);
  });

  describe("getJobPreferences", () => {
    it("returns ok(null) when no preferences exist", async () => {
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.getPreferences.mockResolvedValue(undefined);

      const result = await service.getJobPreferences(1);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBeNull();
      }
    });

    it("returns ok(preference) when preferences exist", async () => {
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.getPreferences.mockResolvedValue(mockPreference);

      const result = await service.getJobPreferences(1);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockPreference);
      }
    });

    it("returns fail(NotFoundError) when user has no profile", async () => {
      mockProfileRepo.findByIdWithProfile.mockResolvedValue({
        ...mockUserWithProfile,
        profile: null,
      });

      const result = await service.getJobPreferences(1);

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("returns fail(NotFoundError) when user does not exist", async () => {
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(undefined);

      const result = await service.getJobPreferences(999);

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe("updateJobPreferences", () => {
    it("creates preferences successfully on first call", async () => {
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(mockPreference);

      const result = await service.updateJobPreferences(1, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockPreference);
      }
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
        volunteerHoursPerWeek: null,
        workScheduleDays: [],
        scheduleTypes: [],
      });
    });

    it("allows partial save with only jobTypes when no existing preferences", async () => {
      const partialPref = {
        ...mockPreference,
        compensationTypes: [],
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.getPreferences.mockResolvedValue(undefined);
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(partialPref);

      const result = await service.updateJobPreferences(1, {
        jobTypes: [JobType.FullTime],
      });

      expect(result.isSuccess).toBe(true);
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [],
        volunteerHoursPerWeek: null,
        workScheduleDays: [],
        scheduleTypes: [],
      });
    });

    it("allows partial save with only compensationTypes when no existing preferences", async () => {
      const partialPref = {
        ...mockPreference,
        jobTypes: [],
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.getPreferences.mockResolvedValue(undefined);
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(partialPref);

      const result = await service.updateJobPreferences(1, {
        compensationTypes: [CompensationType.Paid],
      });

      expect(result.isSuccess).toBe(true);
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [],
        compensationTypes: [CompensationType.Paid],
        volunteerHoursPerWeek: null,
        workScheduleDays: [],
        scheduleTypes: [],
      });
    });

    it("merges with existing preferences on partial update", async () => {
      const updatedPref = {
        ...mockPreference,
        compensationTypes: [CompensationType.Missionary],
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.getPreferences.mockResolvedValue(mockPreference);
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(updatedPref);

      const result = await service.updateJobPreferences(1, {
        compensationTypes: [CompensationType.Missionary],
      });

      expect(result.isSuccess).toBe(true);
      // jobTypes should come from existing preferences
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Missionary],
        volunteerHoursPerWeek: null,
        workScheduleDays: [],
        scheduleTypes: [],
      });
    });

    it("updates preferences on subsequent call (upsert)", async () => {
      const updatedPref = {
        ...mockPreference,
        jobTypes: [JobType.Contract, JobType.PartTime],
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(updatedPref);

      const result = await service.updateJobPreferences(1, {
        jobTypes: [JobType.Contract, JobType.PartTime],
        compensationTypes: [CompensationType.Paid],
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.jobTypes).toEqual([
          JobType.Contract,
          JobType.PartTime,
        ]);
      }
    });

    it("fails with ValidationError when volunteer type selected without volunteerHoursPerWeek", async () => {
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );

      const result = await service.updateJobPreferences(1, {
        jobTypes: [JobType.Volunteer],
        compensationTypes: [CompensationType.Volunteer],
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("volunteerHoursPerWeek");
      }
    });

    it("succeeds when volunteer type selected with volunteerHoursPerWeek", async () => {
      const volunteerPref = {
        ...mockPreference,
        jobTypes: [JobType.Volunteer],
        compensationTypes: [CompensationType.Volunteer],
        volunteerHoursPerWeek: VolunteerHoursPerWeek.TenToTwenty,
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(volunteerPref);

      const result = await service.updateJobPreferences(1, {
        jobTypes: [JobType.Volunteer],
        compensationTypes: [CompensationType.Volunteer],
        volunteerHoursPerWeek: VolunteerHoursPerWeek.TenToTwenty,
      });

      expect(result.isSuccess).toBe(true);
    });

    it("clears volunteerHoursPerWeek when volunteer type is removed", async () => {
      const clearedPref = {
        ...mockPreference,
        jobTypes: [JobType.FullTime],
        volunteerHoursPerWeek: null,
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(clearedPref);

      const result = await service.updateJobPreferences(1, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
        volunteerHoursPerWeek: VolunteerHoursPerWeek.TenToTwenty,
      });

      expect(result.isSuccess).toBe(true);
      // Verify that volunteerHoursPerWeek was nullified since volunteer is not in jobTypes
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
        volunteerHoursPerWeek: null,
        workScheduleDays: [],
        scheduleTypes: [],
      });
    });

    it("allows clearing all job types with empty array", async () => {
      const clearedPref = {
        ...mockPreference,
        jobTypes: [],
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.getPreferences.mockResolvedValue(mockPreference);
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(clearedPref);

      const result = await service.updateJobPreferences(1, {
        jobTypes: [],
      });

      expect(result.isSuccess).toBe(true);
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [],
        compensationTypes: [CompensationType.Paid],
        volunteerHoursPerWeek: null,
        workScheduleDays: [],
        scheduleTypes: [],
      });
    });

    it("allows clearing all compensation types with empty array", async () => {
      const clearedPref = {
        ...mockPreference,
        compensationTypes: [],
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.getPreferences.mockResolvedValue(mockPreference);
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(clearedPref);

      const result = await service.updateJobPreferences(1, {
        compensationTypes: [],
      });

      expect(result.isSuccess).toBe(true);
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [],
        volunteerHoursPerWeek: null,
        workScheduleDays: [],
        scheduleTypes: [],
      });
    });

    it("saves workScheduleDays and scheduleTypes alongside existing fields", async () => {
      const prefWithSchedule = {
        ...mockPreference,
        workScheduleDays: [WorkScheduleDay.Monday, WorkScheduleDay.Wednesday],
        scheduleTypes: [ScheduleType.Fixed],
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(prefWithSchedule);

      const result = await service.updateJobPreferences(1, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
        workScheduleDays: [WorkScheduleDay.Monday, WorkScheduleDay.Wednesday],
        scheduleTypes: [ScheduleType.Fixed],
      });

      expect(result.isSuccess).toBe(true);
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
        volunteerHoursPerWeek: null,
        workScheduleDays: [WorkScheduleDay.Monday, WorkScheduleDay.Wednesday],
        scheduleTypes: [ScheduleType.Fixed],
      });
    });

    it("merges workScheduleDays with existing on partial update", async () => {
      const existingWithSchedule = {
        ...mockPreference,
        workScheduleDays: [WorkScheduleDay.Monday, WorkScheduleDay.Friday],
        scheduleTypes: [ScheduleType.Flexible],
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.getPreferences.mockResolvedValue(existingWithSchedule);
      mockPreferenceRepo.upsertPreferences.mockResolvedValue({
        ...existingWithSchedule,
        scheduleTypes: [ScheduleType.Rotating],
      });

      const result = await service.updateJobPreferences(1, {
        scheduleTypes: [ScheduleType.Rotating],
      });

      expect(result.isSuccess).toBe(true);
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
        volunteerHoursPerWeek: null,
        workScheduleDays: [WorkScheduleDay.Monday, WorkScheduleDay.Friday],
        scheduleTypes: [ScheduleType.Rotating],
      });
    });

    it("allows partial save with only workScheduleDays", async () => {
      const partialPref = {
        ...mockPreference,
        workScheduleDays: [WorkScheduleDay.Tuesday, WorkScheduleDay.Thursday],
      };
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(
        mockUserWithProfile,
      );
      mockPreferenceRepo.getPreferences.mockResolvedValue(undefined);
      mockPreferenceRepo.upsertPreferences.mockResolvedValue(partialPref);

      const result = await service.updateJobPreferences(1, {
        workScheduleDays: [WorkScheduleDay.Tuesday, WorkScheduleDay.Thursday],
      });

      expect(result.isSuccess).toBe(true);
      expect(mockPreferenceRepo.upsertPreferences).toHaveBeenCalledWith(42, {
        jobTypes: [],
        compensationTypes: [],
        volunteerHoursPerWeek: null,
        workScheduleDays: [WorkScheduleDay.Tuesday, WorkScheduleDay.Thursday],
        scheduleTypes: [],
      });
    });

    it("returns fail(NotFoundError) when user has no profile", async () => {
      mockProfileRepo.findByIdWithProfile.mockResolvedValue({
        ...mockUserWithProfile,
        profile: null,
      });

      const result = await service.updateJobPreferences(1, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("returns fail when user does not exist", async () => {
      mockProfileRepo.findByIdWithProfile.mockResolvedValue(undefined);

      const result = await service.updateJobPreferences(999, {
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });
});
