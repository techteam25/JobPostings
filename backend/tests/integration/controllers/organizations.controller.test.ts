// noinspection DuplicatedCode

import { request, TestHelpers } from "@tests/utils/testHelpers";

import { db } from "@/db/connection";
import { organizationMembers, organizations, user } from "@/db/schema";
import { seedOrganizations, seedUser } from "@tests/utils/seed";
import { organizationFixture } from "@tests/utils/fixtures";
import { sql } from "drizzle-orm";

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

      await seedUser();

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
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

      await seedUser();

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
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

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Organization deleted successfully",
      );
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
