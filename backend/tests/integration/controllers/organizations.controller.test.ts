import { request, TestHelpers } from "@tests/utils/testHelpers";
import { beforeEach } from "vitest";
import { sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { organizations } from "@/db/schema";

describe("Organization Controller Integration Tests", () => {
  beforeEach(async () => {
    const { faker } = await import("@faker-js/faker");
    // Clear organizations table before each test
    await db.execute(sql`# noinspection SqlWithoutWhere
    DELETE
    FROM organizations`);

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

      console.log(response.body);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Organizations retrieved successfully",
      );
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
