import { user } from "@/db/schema";
import { db } from "@shared/db/connection";

import { OrganizationsService } from "@/modules/organizations/services/organizations.service";
import { OrganizationsRepository } from "@/modules/organizations/repositories/organizations.repository";

import { seedJobsScenario } from "@tests/utils/seedScenarios";

describe("OrganizationsService", () => {
  beforeEach(async () => {
    const { faker } = await import("@faker-js/faker");
    const bcrypt = await import("bcrypt");

    const hashedPassword = await bcrypt.hash("Password@123", 12);
    await seedJobsScenario();

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

  function createMockIntentSync() {
    return {
      syncIntentToUser: vi.fn(async () => {}),
    };
  }

  describe("isRolePermitted", () => {
    it("should return true when user has job posting role", async () => {
      const mockIntentSync = createMockIntentSync();
      const organizationsService = new OrganizationsService(
        new OrganizationsRepository(),
        mockIntentSync,
      );

      const result = await organizationsService.isRolePermitted(1);
      expect(result.isSuccess).toBe(true);

      if (result.isSuccess) {
        expect(result.value).toBe(true);
      }
    });
    it("should return false when user does not have job posting role", async () => {
      const mockIntentSync = createMockIntentSync();
      const organizationsService = new OrganizationsService(
        new OrganizationsRepository(),
        mockIntentSync,
      );

      const result = await organizationsService.isRolePermitted(999);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBe(false);
      }
    });
  });
});
