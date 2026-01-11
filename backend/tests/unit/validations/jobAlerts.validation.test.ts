import { describe, it, expect } from "vitest";
import {
  createJobAlertSchema,
  getUserJobAlertsQuerySchema,
  insertJobAlertSchema,
} from "@/validations/jobAlerts.validation";

describe("Job Alert Validation Logic", () => {
  describe("createJobAlertSchema - Required Criteria", () => {
    it("should accept alert with only searchQuery", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test description",
          searchQuery: "software engineer",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept alert with only location (city)", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test description",
          city: "San Francisco",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept alert with only location (state)", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test description",
          state: "California",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept alert with only skills", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test description",
          skills: ["JavaScript", "React"],
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept alert with only jobType", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test description",
          jobType: ["full-time"],
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept alert with only experienceLevel", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test description",
          experienceLevel: ["mid"],
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject alert with no search criteria", () => {
      const invalidData = {
        body: {
          name: "Test Alert",
          description: "Test description",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "At least one of search query, location, skills, experience level or employment types must be provided.",
        );
      }
    });

    it("should reject alert with empty searchQuery", () => {
      const invalidData = {
        body: {
          name: "Test Alert",
          description: "Test description",
          searchQuery: "   ",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept alert with multiple criteria", () => {
      const validData = {
        body: {
          name: "Senior Developer",
          description: "Looking for senior positions",
          searchQuery: "senior developer",
          city: "New York",
          state: "NY",
          skills: ["Python", "Django"],
          jobType: ["full-time", "contract"],
          experienceLevel: ["senior"],
          includeRemote: true,
          frequency: "daily",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("createJobAlertSchema - Name Validation", () => {
    it("should reject name shorter than 3 characters", () => {
      const invalidData = {
        body: {
          name: "AB",
          description: "Test description",
          searchQuery: "test",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "at least 3 characters",
        );
      }
    });

    it("should reject name longer than 100 characters", () => {
      const invalidData = {
        body: {
          name: "A".repeat(101),
          description: "Test description",
          searchQuery: "test",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject name with special characters", () => {
      const invalidData = {
        body: {
          name: "Test Alert @#$",
          description: "Test description",
          searchQuery: "test",
          frequency: "weekly",
        },
      };

      const result = createJobAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept name with spaces and hyphens", () => {
      const validData = {
        body: {
          name: "Software Engineer - Remote",
          description: "Test description",
          searchQuery: "test",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("createJobAlertSchema - Frequency Validation", () => {
    it("should accept valid frequency: daily", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test",
          searchQuery: "test",
          frequency: "daily",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept valid frequency: weekly", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test",
          searchQuery: "test",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept valid frequency: monthly", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test",
          searchQuery: "test",
          frequency: "monthly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should default to weekly when not provided", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test",
          searchQuery: "test",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.frequency).toBe("weekly");
      }
    });

    it("should reject invalid frequency", () => {
      const invalidData = {
        body: {
          name: "Test Alert",
          description: "Test",
          searchQuery: "test",
          frequency: "hourly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("createJobAlertSchema - Boolean Fields", () => {
    it("should default includeRemote to true", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test",
          searchQuery: "test",
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      if (result.success) {
        expect(result.data.body.includeRemote).toBe(true);
      }
    });

    it("should accept includeRemote false", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test",
          searchQuery: "test",
          includeRemote: false,
          frequency: "weekly",
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.includeRemote).toBe(false);
      }
    });
  });

  describe("getUserJobAlertsQuerySchema - Pagination Validation", () => {
    it("should accept valid pagination parameters", () => {
      const validData = {
        query: {
          page: "2",
          limit: "20",
        },
        params: {},
        body: {},
      };

      const result = getUserJobAlertsQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.page).toBe(2);
        expect(result.data.query.limit).toBe(20);
      }
    });

    it("should reject page less than 1", () => {
      const invalidData = {
        query: {
          page: "0",
        },
        params: {},
        body: {},
      };

      const result = getUserJobAlertsQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject limit less than 1", () => {
      const invalidData = {
        query: {
          limit: "0",
        },
        params: {},
        body: {},
      };

      const result = getUserJobAlertsQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const invalidData = {
        query: {
          limit: "101",
        },
        params: {},
        body: {},
      };

      const result = getUserJobAlertsQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should use default values when not provided", () => {
      const validData = {
        query: {},
        params: {},
        body: {},
      };

      const result = getUserJobAlertsQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.page).toBe(1);
        expect(result.data.query.limit).toBe(10);
      }
    });
  });

  describe("jobAlertValidationSchema - Complex Validation", () => {
    it("should validate all fields together", () => {
      const validData = {
        name: "Full Stack Developer",
        description: "Looking for full stack opportunities",
        searchQuery: "full stack developer",
        city: "Seattle",
        state: "Washington",
        jobType: ["full-time", "contract"],
        skills: ["JavaScript", "React", "Node.js"],
        experienceLevel: ["mid", "senior"],
        includeRemote: true,
        frequency: "daily",
        userId: 1,
      };

      const result = insertJobAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should sanitize and validate empty arrays", () => {
      const validData = {
        body: {
          name: "Test Alert",
          description: "Test",
          jobType: [],
          skills: [],
          experienceLevel: [],
          frequency: "weekly",
          userId: 1,
        },
        params: {},
        query: {},
      };

      const result = createJobAlertSchema.safeParse(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "At least one of search query, location, skills, experience level or employment types must be provided",
        );
      }
    });
  });
});
