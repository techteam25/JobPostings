import { user } from "@/db/schema";
import { db } from "@/db/connection";

import { OrganizationService } from "@/services/organization.service";

import { seedJobs } from "@tests/utils/seed";

describe("OrganizationService", () => {
  beforeEach(async () => {
    const { faker } = await import("@faker-js/faker");
    const bcrypt = await import("bcrypt");

    const hashedPassword = await bcrypt.hash("Password@123", 12);
    await seedJobs();

    await db.insert(user).values(
      Array.from({ length: 2 }).map((_, index) => ({
        email: `user${index + 1}@email.com`,
        passwordHash: hashedPassword,
        fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
        emailVerified: true,
        image: faker.image.avatar(),
        role: "user" as const,
      })),
    );
  });
  describe("requireJobPostingRole", () => {
    it("should return true when user has job posting role", async () => {
      const organizationService = new OrganizationService();

      const result = await organizationService.isRolePermitted(1);
      expect(result).toBe(true);
    });
    it("should return false when user does not have job posting role", async () => {
      const organizationService = new OrganizationService();

      const result = await organizationService.isRolePermitted(2);
      expect(result).toBe(false);
    });
  });
});
