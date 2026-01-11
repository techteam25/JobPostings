import { beforeEach, describe, expect, it } from "vitest";
import { request } from "@tests/utils/testHelpers";
import { db } from "@/db/connection";
import { jobAlerts, user } from "@/db/schema";
import { seedUser } from "@tests/utils/seed";
import { eq } from "drizzle-orm";

describe("Job Alerts API Integration Tests", () => {
  let authCookie: string[];
  let userId: number;

  beforeEach(async () => {
    // Seed a test user
    await seedUser();

    // Login to get auth cookie and user ID
    const loginResponse = await request.post("/api/auth/sign-in/email").send({
      email: "normal.user@example.com",
      password: "Password@123",
    });

    authCookie = (loginResponse.headers["set-cookie"] || []) as string[];

    // Get the user ID from the database
    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, "normal.user@example.com"),
    });

    if (foundUser) {
      userId = foundUser.id;
    }

    // Clean up any existing job alerts for the test user
    if (userId) {
      await db.delete(jobAlerts).where(eq(jobAlerts.userId, userId));
    }
  });

  describe("POST /api/users/me/job-alerts", () => {
    it("should create a job alert successfully", async () => {
      const alertData = {
        name: "Software Engineer Jobs",
        description: "Looking for software engineering roles",
        searchQuery: "software engineer",
        city: "San Francisco",
        state: "CA",
        includeRemote: true,
        frequency: "weekly",
      };

      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Job alert created successfully");
      expect(response.body.data).toMatchObject({
        name: alertData.name,
        description: alertData.description,
        userId: userId,
        isActive: true,
        isPaused: false,
      });
      expect(response.body.data.id).toBeDefined();
    });

    it("should fail when exceeding 10 active alerts", async () => {
      // Create 10 alerts first
      for (let i = 0; i < 10; i++) {
        await request
          .post("/api/users/me/job-alerts")
          .set("Cookie", authCookie)
          .send({
            name: `Alert ${i}`,
            description: "Test",
            searchQuery: "test",
            frequency: "weekly",
          });
      }

      // Try to create 11th alert
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Alert 11",
          description: "Test",
          searchQuery: "test",
          frequency: "weekly",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Maximum active job alerts");
    });

    it("should require authentication", async () => {
      await request
        .post("/api/users/me/job-alerts")
        .send({
          name: "Test",
          description: "Test",
          searchQuery: "test",
          frequency: "weekly",
        })
        .expect(401);
    });

    it("should validate required fields", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should require at least one search criterion", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Invalid Alert",
          description: "No search criteria",
          frequency: "weekly",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      // Check that the validation error details contain the expected message
      const errorDetail = response.body.error.details.find((detail: any) =>
        detail.message.includes("At least one"),
      );
      expect(errorDetail).toBeDefined();
    });

    it("should accept skills array as search criterion", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Skills Alert",
          description: "Test",
          skills: ["JavaScript", "TypeScript"],
          frequency: "daily",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.skills).toEqual(["JavaScript", "TypeScript"]);
    });
  });

  describe("GET /api/users/me/job-alerts", () => {
    beforeEach(async () => {
      // Create some test alerts
      for (let i = 0; i < 3; i++) {
        await request
          .post("/api/users/me/job-alerts")
          .set("Cookie", authCookie)
          .send({
            name: `Test Alert ${i + 1}`,
            description: "Test description",
            searchQuery: `test ${i + 1}`,
            frequency: "weekly",
          });
      }
    });

    it("should return paginated job alerts", async () => {
      const response = await request
        .get("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Job alerts retrieved successfully");
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(3);
    });

    it("should respect pagination limit", async () => {
      const response = await request
        .get("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it("should require authentication", async () => {
      await request.get("/api/users/me/job-alerts").expect(401);
    });

    it("should return empty array when no alerts exist", async () => {
      // Clean up alerts
      await db.delete(jobAlerts).where(eq(jobAlerts.userId, userId));

      const response = await request
        .get("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe("GET /api/users/me/job-alerts/:id", () => {
    let alertId: number;

    beforeEach(async () => {
      // Create a test alert
      const createResponse = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Test Alert",
          description: "Test",
          searchQuery: "test",
          frequency: "weekly",
        });

      alertId = createResponse.body.data.id;
    });

    it("should return specific job alert", async () => {
      const response = await request
        .get(`/api/users/me/job-alerts/${alertId}`)
        .set("Cookie", authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Job alert retrieved successfully");
      expect(response.body.data.id).toBe(alertId);
      expect(response.body.data.name).toBe("Test Alert");
    });

    it("should return 404 for non-existent alert", async () => {
      await request
        .get("/api/users/me/job-alerts/99999")
        .set("Cookie", authCookie)
        .expect(404);
    });

    it("should not return alerts from other users", async () => {
      // Login as other user
      const loginRes = await request.post("/api/auth/sign-in/email").send({
        email: "other.user@example.com",
        password: "Password@123",
      });

      const otherCookie = (loginRes.headers["set-cookie"] || []) as string[];

      // Create alert for other user
      const createRes = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", otherCookie)
        .send({
          name: "Other User Alert",
          description: "Test",
          searchQuery: "test",
          frequency: "weekly",
        });

      const otherAlertId = createRes.body.data.id;

      // Try to access other user's alert with original user's cookie
      await request
        .get(`/api/users/me/job-alerts/${otherAlertId}`)
        .set("Cookie", authCookie)
        .expect(404);
    });

    it("should require authentication", async () => {
      await request.get(`/api/users/me/job-alerts/${alertId}`).expect(401);
    });

    it("should validate alert ID is a positive integer", async () => {
      await request
        .get("/api/users/me/job-alerts/invalid")
        .set("Cookie", authCookie)
        .expect(400);
    });
  });

  describe("POST /api/users/me/job-alerts - Validation Tests", () => {
    it("should reject alert with no search criteria", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Invalid Alert",
          description: "No criteria",
          frequency: "weekly",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject alert with empty searchQuery", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Invalid Alert",
          description: "Empty search",
          searchQuery: "   ",
          frequency: "weekly",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject alert with name too short", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "AB",
          description: "Short name",
          searchQuery: "test",
          frequency: "weekly",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject alert with name containing special characters", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Test Alert @#$%",
          description: "Special chars",
          searchQuery: "test",
          frequency: "weekly",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject alert with invalid frequency", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Test Alert",
          description: "Invalid frequency",
          searchQuery: "test",
          frequency: "hourly",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should accept alert with only city", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "City Alert",
          description: "City only",
          city: "Seattle",
          frequency: "weekly",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.city).toBe("Seattle");
    });

    it("should accept alert with only state", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "State Alert",
          description: "State only",
          state: "California",
          frequency: "weekly",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.state).toBe("California");
    });

    it("should accept alert with only skills", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Skills Alert",
          description: "Skills only",
          skills: ["JavaScript", "React"],
          frequency: "weekly",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.skills).toEqual(["JavaScript", "React"]);
    });

    it("should accept alert with only jobType", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "JobType Alert",
          description: "JobType only",
          jobType: ["full-time"],
          frequency: "weekly",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it("should accept alert with only experienceLevel", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Experience Alert",
          description: "Experience only",
          experienceLevel: ["mid"],
          frequency: "weekly",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it("should accept alert with multiple criteria", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Complex Alert",
          description: "Multiple criteria",
          searchQuery: "software engineer",
          city: "Seattle",
          state: "Washington",
          skills: ["JavaScript", "TypeScript"],
          jobType: ["full-time", "contract"],
          experienceLevel: ["mid", "senior"],
          includeRemote: true,
          frequency: "daily",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.searchQuery).toBe("software engineer");
      expect(response.body.data.city).toBe("Seattle");
      expect(response.body.data.skills).toEqual(["JavaScript", "TypeScript"]);
    });

    it("should default frequency to weekly", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Default Frequency",
          description: "No frequency specified",
          searchQuery: "test",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.frequency).toBe("weekly");
    });

    it("should default includeRemote to true", async () => {
      const response = await request
        .post("/api/users/me/job-alerts")
        .set("Cookie", authCookie)
        .send({
          name: "Default Remote",
          description: "No remote specified",
          searchQuery: "test",
          frequency: "weekly",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.includeRemote).toBe(true);
    });
  });
});
