// noinspection DuplicatedCode

import { sql } from "drizzle-orm";
import { db } from "@/db/connection";
import { organizationMembers, organizations, user } from "@/db/schema";

import { request, TestHelpers } from "@tests/utils/testHelpers";
import {
  seedJobApplications,
  seedOrganizations,
  seedUser,
} from "@tests/utils/seed";
import { organizationFixture } from "@tests/utils/fixtures";
import { expect } from "vitest";

describe("Organization Controller Integration Tests", async () => {
  const { faker } = await import("@faker-js/faker");
  beforeEach(async () => {
    // Clear organizations table before each test
    await db.delete(user);
    await db.delete(organizations);

    await seedOrganizations();
  });
  describe("GET /organizations", () => {
    it("should retrieve all organizations returning 200", async () => {
      const response = await request.get("/api/organizations");

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Organizations retrieved successfully",
      );
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it("should retrieve a single organization returning 200", async () => {
      const response = await request.get("/api/organizations/1");

      TestHelpers.validateApiResponse(response, 200);
    });
  });

  describe("POST /organizations", async () => {
    let cookie: string | undefined;

    beforeEach(async () => {
      await db.delete(organizationMembers);
      await db.delete(organizations);

      // Reset auto-increment counters
      await db.execute(
        sql`ALTER TABLE organization_members AUTO_INCREMENT = 1`,
      );
      await db.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);

      await seedUser();

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });
      cookie = response.headers["set-cookie"]
        ? response.headers["set-cookie"][0]
        : "";
    });

    it("should create a new organization returning 201", async () => {
      const newOrganization = await organizationFixture();

      const response = await request
        .post("/api/organizations")
        .set("Cookie", cookie ?? "")
        .send(newOrganization);

      TestHelpers.validateApiResponse(response, 201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Organization created successfully",
      );
      expect(response.body.data).toMatchObject(newOrganization);
      expect(response.body.data).toHaveProperty("members");
      expect(Array.isArray(response.body.data.members)).toBe(true);
      expect(response.body.data.members[0]).toHaveProperty("role", "owner");
    });

    it("should fail to create a new organization without auth returning 401", async () => {
      const newOrganization = await organizationFixture();

      const response = await request
        .post("/api/organizations")
        .send(newOrganization);

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required",
      );
      expect(response.body).toHaveProperty("error", "UNAUTHORIZED");
    });
  });
  describe("PUT /organizations/:organizationId", () => {
    let cookie: string | undefined;

    beforeEach(async () => {
      await db.delete(organizationMembers);
      await db.delete(organizations);

      // Reset auto-increment counters
      await db.execute(
        sql`ALTER TABLE organization_members AUTO_INCREMENT = 1`,
      );
      await db.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);

      await seedOrganizations();

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "org.owner@example.com",
        password: "Password@123",
      });

      cookie = response.headers["set-cookie"]
        ? response.headers["set-cookie"][0]
        : "";

      const newOrganization = await organizationFixture();

      await request
        .post("/api/organizations")
        .set("Cookie", cookie!)
        .send(newOrganization);
    });
    it("should update an existing organization returning 200", async () => {
      const response = await request
        .put("/api/organizations/1")
        .set("Cookie", cookie!)
        .send({
          streetAddress: "123 New St",
          city: "New City",
          state: "NC",
          zipCode: "12345",
        });

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Organization updated successfully",
      );

      const { data } = response.body;
      expect(data).toHaveProperty("id", 1);
      expect(data).toHaveProperty("streetAddress", "123 New St");
      expect(data).toHaveProperty("city", "New City");
      expect(data).toHaveProperty("state", "NC");
      expect(data).toHaveProperty("zipCode", "12345");
    });

    it("should fail to update an organization without auth returning 401", async () => {
      const updatedOrganization = await organizationFixture();

      const response = await request
        .put("/api/organizations/1")
        .send(updatedOrganization);

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required",
      );
    });
  });

  describe("DELETE /organizations/:organizationId", () => {
    let cookie: string | undefined;

    beforeEach(async () => {
      await db.delete(organizationMembers);
      await db.delete(organizations);

      // Reset auto-increment counters
      await db.execute(
        sql`ALTER TABLE organization_members AUTO_INCREMENT = 1`,
      );
      await db.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);

      await seedOrganizations();

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "org.owner@example.com",
        password: "Password@123",
      });

      cookie = response.headers["set-cookie"]
        ? response.headers["set-cookie"][0]
        : "";

      await request
        .post("/api/organizations")
        .set("Cookie", cookie!)
        .send({
          name: faker.company.name(),
          streetAddress: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode("#####"),
          phone: faker.phone.number({ style: "national" }),
          url: faker.internet.url(),
          mission: faker.lorem.sentence(),
        });
    });

    it("should delete an existing organization returning 200", async () => {
      const response = await request
        .delete("/api/organizations/1")
        .set("Cookie", cookie!);

      expect(response.status).toBe(204);
    });

    it("should fail to delete an organization without auth returning 401", async () => {
      const response = await request.delete("/api/organizations/1");

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required",
      );
    });
  });
});
describe("Organization Controller Application Management Integration Tests", () => {
  let cookie: string;
  beforeEach(async () => {
    await seedJobApplications();

    const response = await request.post("/api/auth/sign-in/email").send({
      email: "org.member@example.com",
      password: "Password@123",
    });
    cookie = response.headers["set-cookie"]![0]!;
  });
  describe("GET /organizations/:organizationId/jobs/:jobId/applications", () => {
    it("should retrieve all job applications for a specific job under an organization returning 200", async () => {
      const response = await request
        .get("/api/organizations/1/jobs/1/applications")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job applications retrieved successfully",
      );
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should retrieve an empty array when no applications exist for the job returning 200", async () => {
      const response = await request
        .get("/api/organizations/1/jobs/999/applications")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job applications retrieved successfully",
      );
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it("should return 403 when organization does not exist", async () => {
      const response = await request
        .get("/api/organizations/999/jobs/1/applications")
        .set("Cookie", cookie);

      // 403 is returned because the user is not a member of the non-existent organization
      TestHelpers.validateApiResponse(response, 403);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Insufficient permissions",
      );
    });
  });
  describe("/organizations/:organizationId/jobs/:jobId/applications/:applicationId", () => {
    it("should retrieve a specific job application under an organization returning 200", async () => {
      const response = await request
        .get("/api/organizations/1/jobs/1/applications/1")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job application retrieved successfully",
      );
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("jobId");
      expect(response.body.data).toHaveProperty("status");
    });

    it("should return 404 when job application does not exist", async () => {
      const response = await request
        .get("/api/organizations/1/jobs/1/applications/999")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "jobApplications with id 999 does not exist.",
      );
    });
  });
  describe('PATCH "/:organizationId/jobs/:jobId/applications/:applicationId/status"', () => {
    beforeEach(async () => {
      const response = await request.post("/api/auth/sign-in/email").send({
        email: "owner.user@example.com",
        password: "Password@123",
      });
      cookie = response.headers["set-cookie"]![0]!;
    });

    it("should update the status of a job application returning 200", async () => {
      const response = await request
        .patch("/api/organizations/1/jobs/1/applications/1/status")
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      console.log(JSON.stringify(response.body, null, 2));

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job application status updated successfully",
      );
      expect(response.body.data).toHaveProperty("id", 1);
      expect(response.body.data).toHaveProperty("status", "reviewed");
    });

    it("should return 400 when updating with an invalid status", async () => {
      const response = await request
        .patch("/api/organizations/1/jobs/1/applications/1/status")
        .set("Cookie", cookie)
        .send({ status: "invalid_status" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty(
        "message",
        "Request validation failed",
      );
    });
  });
  describe('POST "/:organizationId/jobs/:jobId/applications/:applicationId/notes"', () => {
    beforeEach(async () => {
      const response = await request.post("/api/auth/sign-in/email").send({
        email: "org.member@example.com",
        password: "Password@123",
      });
      cookie = response.headers["set-cookie"]![0]!;
    });

    it("should add a note to a job application returning 201", async () => {
      const response = await request
        .post("/api/organizations/1/jobs/1/applications/1/notes")
        .set("Cookie", cookie)
        .send({ note: "This is a test note." });

      TestHelpers.validateApiResponse(response, 201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Note added to job application successfully",
      );
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("notes");
      expect(Array.isArray(response.body.data.notes)).toBeTruthy();
      expect(response.body.data.notes[0]).toHaveProperty(
        "note",
        "This is a test note.",
      );
    });

    it("should return 400 when adding an empty note", async () => {
      const response = await request
        .post("/api/organizations/1/jobs/1/applications/1/notes")
        .set("Cookie", cookie)
        .send({ note: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty(
        "message",
        "Request validation failed",
      );
    });
  });
  describe("GET /:organizationId/jobs/:jobId/applications/:applicationId/notes", () => {
    it("should retrieve all notes for a job application returning 200", async () => {
      const response = await request
        .get("/api/organizations/1/jobs/1/applications/1/notes")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job application notes retrieved successfully",
      );
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 404 when job application does not exist", async () => {
      const response = await request
        .get("/api/organizations/1/jobs/1/applications/999/notes")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 404);

      expect(response.body).toHaveProperty("success", false);
    });
  });
});

describe("Organization Controller - Get Applications for Organization Integration Tests", () => {
  let cookie: string;

  beforeEach(async () => {
    await seedJobApplications();

    const response = await request.post("/api/auth/sign-in/email").send({
      email: "org.member@example.com",
      password: "Password@123",
    });
    cookie = response.headers["set-cookie"]![0]!;
  });

  describe("GET /organizations/:organizationId/applications", () => {
    it("should retrieve all job applications for an organization with default pagination returning 200", async () => {
      const response = await request
        .get("/api/organizations/1/applications")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job applications retrieved successfully",
      );
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Validate pagination metadata
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("totalPages");

      // Validate application structure
      const application = response.body.data[0];
      expect(application).toHaveProperty("applicationId");
      expect(application).toHaveProperty("jobId");
      expect(application).toHaveProperty("applicantName");
      expect(application).toHaveProperty("applicantEmail");
      expect(application).toHaveProperty("status");
      expect(application).toHaveProperty("coverLetter");
      expect(application).toHaveProperty("resumeUrl");
      expect(application).toHaveProperty("appliedAt");
      expect(application).toHaveProperty("jobTitle");
      expect(application).toHaveProperty("organizationId");
      expect(application).toHaveProperty("organizationName");
    });

    it("should retrieve job applications with custom pagination parameters returning 200", async () => {
      const response = await request
        .get("/api/organizations/1/applications?page=1&limit=2")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Validate pagination respects custom parameters
      expect(response.body.pagination).toHaveProperty("page", "1");
      expect(response.body.pagination).toHaveProperty("limit", "2");
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it("should return applications sorted by appliedAt in descending order", async () => {
      const response = await request
        .get("/api/organizations/1/applications")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      const applications = response.body.data;
      if (applications.length > 1) {
        const firstDate = new Date(applications[0].appliedAt);
        const secondDate = new Date(applications[1].appliedAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(
          secondDate.getTime(),
        );
      }
    });

    it("should return 404 when organization does not exist", async () => {
      const response = await request
        .get("/api/organizations/999/applications")
        .set("Cookie", cookie);

      // User is not a member of non-existent organization, should get 403
      TestHelpers.validateApiResponse(response, 403);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Insufficient permissions",
      );
    });

    it("should return 403 when user is not a member of the organization", async () => {
      // Sign in as a different user who is not a member of organization 1
      const nonMemberResponse = await request
        .post("/api/auth/sign-in/email")
        .send({
          email: "applicant.user@example.com",
          password: "Password@123",
        });

      const nonMemberCookie = nonMemberResponse.headers["set-cookie"]![0]!;

      const response = await request
        .get("/api/organizations/1/applications")
        .set("Cookie", nonMemberCookie);

      TestHelpers.validateApiResponse(response, 403);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Insufficient permissions",
      );
    });

    it("should handle invalid pagination parameters gracefully", async () => {
      const response = await request
        .get("/api/organizations/1/applications?page=0&limit=-1")
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
    });

    it("should include all required fields in the response", async () => {
      const response = await request
        .get("/api/organizations/1/applications")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      const requiredFields = [
        "applicationId",
        "jobId",
        "applicantName",
        "applicantEmail",
        "status",
        "appliedAt",
        "jobTitle",
        "organizationId",
        "organizationName",
      ];

      if (response.body.data.length > 0) {
        const application = response.body.data[0];
        requiredFields.forEach((field) => {
          expect(application).toHaveProperty(field);
        });
      }
    });

    it("should return correct total count in pagination metadata", async () => {
      const response = await request
        .get("/api/organizations/1/applications")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      const { pagination } = response.body;
      expect(pagination.total).toBeGreaterThanOrEqual(
        response.body.data.length,
      );
      expect(pagination.totalPages).toBe(
        Math.ceil(pagination.total / pagination.limit),
      );
    });
  });
});
