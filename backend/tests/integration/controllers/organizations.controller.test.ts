import { request, TestHelpers } from "@tests/utils/testHelpers";

import { db } from "@/db/connection";
import { organizations, User, users } from "@/db/schema";
import { AuthTokens } from "@/types";

describe("Organization Controller Integration Tests", async () => {
  const { faker } = await import("@faker-js/faker");
  beforeEach(async () => {
    const { faker } = await import("@faker-js/faker");

    // Clear organizations table before each test
    await db.delete(users);
    await db.delete(organizations);

    await db.insert(organizations).values({
      id: 1,
      name: faker.company.name(),
      streetAddress: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode("#####"),
      phone: faker.phone.number({ style: "international" }),
      contact: 1,
      url: faker.internet.url(),
      mission: faker.lorem.sentence(),
    });
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
    });

    it("should retrieve a single organization returning 200", async () => {
      const response = await request.get("/api/organizations/1");

      TestHelpers.validateApiResponse(response, 200);
    });
  });

  describe("POST /organizations", async () => {
    let userResponse: { data: { user: User; tokens: AuthTokens } };

    beforeEach(async () => {
      const newUser = {
        id: 1,
        email: faker.internet.email(),
        password: "Password@123",
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: "admin",
      };

      const response = await request.post("/api/auth/register").send(newUser);
      userResponse = response.body;
    });

    it("should create a new organization returning 201", async () => {
      const newOrganization = {
        name: faker.company.name(),
        streetAddress: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode("#####"),
        phone: faker.phone.number({ style: "international" }),
        contact: 1,
        url: faker.internet.url(),
        mission: faker.lorem.sentence(),
      };

      const response = await request
        .post("/api/organizations")
        .set("Authorization", `Bearer ${userResponse.data.tokens.accessToken}`)
        .send(newOrganization);

      TestHelpers.validateApiResponse(response, 201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Organization created successfully",
      );
      expect(response.body.data).toMatchObject(newOrganization);
    });

    it("should fail to create a new organization without auth returning 401", async () => {
      const newOrganization = {
        name: faker.company.name(),
        streetAddress: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode("#####"),
        phone: faker.phone.number({ style: "international" }),
        contact: 1,
        url: faker.internet.url(),
        mission: faker.lorem.sentence(),
      };

      const response = await request
        .post("/api/organizations")
        .send(newOrganization);

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required",
      );
      expect(response.header).toHaveProperty(
        "www-authenticate",
        `Bearer realm=/api/organizations charset="UTF-8"`,
      );
    });
  });
  describe("PUT /organizations/:organizationId", () => {
    let userResponse: { data: { user: User; tokens: AuthTokens } };

    beforeEach(async () => {
      const newUser = {
        id: 1,
        email: faker.internet.email(),
        password: "Password@123",
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: "admin",
      };

      const response = await request.post("/api/auth/register").send(newUser);
      userResponse = response.body;

      await request
        .post("/api/organizations")
        .set("Authorization", `Bearer ${userResponse.data.tokens.accessToken}`)
        .send({
          name: faker.company.name(),
          streetAddress: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode("#####"),
          phone: faker.phone.number({ style: "international" }),
          contact: 1,
          url: faker.internet.url(),
          mission: faker.lorem.sentence(),
        });
    });
    it("should update an existing organization returning 200", async () => {
      const response = await request
        .put("/api/organizations/1")
        .set("Authorization", `Bearer ${userResponse.data.tokens.accessToken}`)
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
      const updatedOrganization = {
        name: faker.company.name(),
        streetAddress: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode("#####"),
        phone: faker.phone.number({ style: "international" }),
        contact: 1,
        url: faker.internet.url(),
        mission: faker.lorem.sentence(),
      };

      const response = await request
        .put("/api/organizations/1")
        .send(updatedOrganization);

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required",
      );
      expect(response.header).toHaveProperty(
        "www-authenticate",
        `Bearer realm=/api/organizations/1 charset="UTF-8"`,
      );
    });
  });

  describe("DELETE /organizations/:organizationId", () => {
    let data: { data: { user: User; tokens: AuthTokens } };

    beforeEach(async () => {
      const newUser = {
        id: 1,
        email: faker.internet.email(),
        password: "Password@123",
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: "admin",
      };

      const response = await request.post("/api/auth/register").send(newUser);
      data = response.body;

      await request
        .post("/api/organizations")
        .set("Authorization", `Bearer ${data.data.tokens.accessToken}`)
        .send({
          name: faker.company.name(),
          streetAddress: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode("#####"),
          phone: faker.phone.number({ style: "international" }),
          contact: 1,
          url: faker.internet.url(),
          mission: faker.lorem.sentence(),
        });
    });

    it("should delete an existing organization returning 200", async () => {
      const response = await request
        .delete("/api/organizations/1")
        .set("Authorization", `Bearer ${data.data.tokens.accessToken}`);

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
      expect(response.header).toHaveProperty(
        "www-authenticate",
        `Bearer realm=/api/organizations/1 charset="UTF-8"`,
      );
    });
  });
});
