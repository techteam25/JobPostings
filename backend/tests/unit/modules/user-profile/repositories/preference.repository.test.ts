import { Mock, vi } from "vitest";

vi.mock("@shared/db/connection", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock("@shared/db/dbErrorHandler", () => ({
  withDbErrorHandling: vi.fn(async (operation: () => Promise<unknown>) => {
    return operation();
  }),
}));

import { db } from "@shared/db/connection";
import { PreferenceRepository } from "@/modules/user-profile/repositories/preference.repository";
import {
  JobType,
  CompensationType,
  VolunteerHoursPerWeek,
} from "@/modules/user-profile/constants/job-preference.constants";

describe("PreferenceRepository", () => {
  let repo: PreferenceRepository;

  beforeEach(() => {
    repo = new PreferenceRepository();
    vi.clearAllMocks();
  });

  describe("getPreferences", () => {
    it("returns the preference row when it exists", async () => {
      const mockRow = {
        id: 1,
        userProfileId: 42,
        jobTypes: [JobType.FullTime],
        compensationTypes: [CompensationType.Paid],
        volunteerHoursPerWeek: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const whereMock = vi.fn().mockResolvedValue([mockRow]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      (db.select as Mock).mockReturnValue({ from: fromMock });

      const result = await repo.getPreferences(42);

      expect(result).toEqual(mockRow);
      expect(db.select).toHaveBeenCalled();
    });

    it("returns undefined when no preference row exists", async () => {
      const whereMock = vi.fn().mockResolvedValue([]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      (db.select as Mock).mockReturnValue({ from: fromMock });

      const result = await repo.getPreferences(999);

      expect(result).toBeUndefined();
    });
  });

  describe("upsertPreferences", () => {
    it("inserts and returns the preference when called for the first time", async () => {
      const insertData = {
        jobTypes: [JobType.FullTime, JobType.Contract],
        compensationTypes: [CompensationType.Paid],
      };

      const mockInserted = {
        id: 1,
        userProfileId: 42,
        ...insertData,
        volunteerHoursPerWeek: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock insert chain
      const onDuplicateKeyUpdateMock = vi
        .fn()
        .mockResolvedValue([{ insertId: 1, affectedRows: 1 }]);
      const valuesMock = vi
        .fn()
        .mockReturnValue({ onDuplicateKeyUpdate: onDuplicateKeyUpdateMock });
      (db.insert as Mock).mockReturnValue({ values: valuesMock });

      // Mock the select-back after upsert
      const whereMock = vi.fn().mockResolvedValue([mockInserted]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      (db.select as Mock).mockReturnValue({ from: fromMock });

      const result = await repo.upsertPreferences(42, insertData);

      expect(result).toEqual(mockInserted);
      expect(db.insert).toHaveBeenCalled();
      expect(db.select).toHaveBeenCalled();
    });

    it("updates and returns the preference on duplicate key", async () => {
      const updateData = {
        jobTypes: [JobType.Volunteer],
        compensationTypes: [CompensationType.Volunteer],
        volunteerHoursPerWeek: VolunteerHoursPerWeek.TenToTwenty,
      };

      const mockUpdated = {
        id: 1,
        userProfileId: 42,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const onDuplicateKeyUpdateMock = vi
        .fn()
        .mockResolvedValue([{ insertId: 0, affectedRows: 2 }]);
      const valuesMock = vi
        .fn()
        .mockReturnValue({ onDuplicateKeyUpdate: onDuplicateKeyUpdateMock });
      (db.insert as Mock).mockReturnValue({ values: valuesMock });

      const whereMock = vi.fn().mockResolvedValue([mockUpdated]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      (db.select as Mock).mockReturnValue({ from: fromMock });

      const result = await repo.upsertPreferences(42, updateData);

      expect(result).toEqual(mockUpdated);
      expect(onDuplicateKeyUpdateMock).toHaveBeenCalled();
    });
  });
});
