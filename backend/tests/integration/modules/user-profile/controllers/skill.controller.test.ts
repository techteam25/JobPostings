import { beforeEach, describe, expect, it, vi } from "vitest";
import { request, TestHelpers } from "@tests/utils/testHelpers";
import { createUser, createUserProfile } from "@tests/utils/seedBuilders";

vi.mock("@shared/infrastructure/queue.service", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@shared/infrastructure/queue.service")
    >();
  return {
    ...original,
    queueService: {
      addJob: vi.fn().mockResolvedValue(undefined),
    },
  };
});

async function seedAndLogin() {
  const user = await createUser({
    email: "skill-test@example.com",
    password: "Password@123",
    name: "Skill Test",
  });
  await createUserProfile(user.id);

  const loginResponse = await request
    .post("/api/auth/sign-in/email")
    .send({ email: user.email, password: "Password@123" });

  const cookie = loginResponse.headers["set-cookie"]?.[0] ?? "";

  return { user, cookie };
}

describe("Skill Controller Integration Tests", () => {
  describe("POST /api/users/me/skills", () => {
    let cookie: string;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;
    });

    it("should link a new skill returning 201", async () => {
      const response = await request
        .post("/api/users/me/skills")
        .set("Cookie", cookie)
        .send({ skillName: "React" });

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Skill linked successfully",
      );
      expect(response.body.data).toHaveProperty("name", "React");
      expect(response.body.data).toHaveProperty("id");
    });

    it("should be idempotent when linking the same skill twice", async () => {
      await request
        .post("/api/users/me/skills")
        .set("Cookie", cookie)
        .send({ skillName: "React" });

      const response = await request
        .post("/api/users/me/skills")
        .set("Cookie", cookie)
        .send({ skillName: "React" });

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveProperty("name", "React");
    });

    it("should return 400 for empty skill name", async () => {
      const response = await request
        .post("/api/users/me/skills")
        .set("Cookie", cookie)
        .send({ skillName: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should return 401 without authentication", async () => {
      const response = await request
        .post("/api/users/me/skills")
        .send({ skillName: "React" });

      TestHelpers.validateApiResponse(response, 401);
    });
  });

  describe("DELETE /api/users/me/skills/:skillId", () => {
    let cookie: string;
    let skillId: number;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;

      // Link a skill to unlink later
      const createResponse = await request
        .post("/api/users/me/skills")
        .set("Cookie", cookie)
        .send({ skillName: "React" });

      skillId = createResponse.body.data.id;
    });

    it("should unlink a skill returning 200", async () => {
      const response = await request
        .delete(`/api/users/me/skills/${skillId}`)
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Skill unlinked successfully",
      );
    });

    it("should return 404 for non-existent skill link", async () => {
      const response = await request
        .delete("/api/users/me/skills/99999")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 404);
    });

    it("should return 401 without authentication", async () => {
      const response = await request.delete(`/api/users/me/skills/${skillId}`);

      TestHelpers.validateApiResponse(response, 401);
    });
  });

  describe("GET /api/users/me/skills/search", () => {
    let cookie: string;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;

      // Seed some skills via link
      await request
        .post("/api/users/me/skills")
        .set("Cookie", cookie)
        .send({ skillName: "React" });
      await request
        .post("/api/users/me/skills")
        .set("Cookie", cookie)
        .send({ skillName: "React Native" });
      await request
        .post("/api/users/me/skills")
        .set("Cookie", cookie)
        .send({ skillName: "TypeScript" });
    });

    it("should return matching skills", async () => {
      const response = await request
        .get("/api/users/me/skills/search?q=React")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(
        response.body.data.every((s: { name: string }) =>
          s.name.includes("React"),
        ),
      ).toBe(true);
    });

    it("should return empty array for non-matching query", async () => {
      const response = await request
        .get("/api/users/me/skills/search?q=NonExistent")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data).toHaveLength(0);
    });

    it("should return 400 for missing query param", async () => {
      const response = await request
        .get("/api/users/me/skills/search")
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
    });

    it("should return 401 without authentication", async () => {
      const response = await request.get("/api/users/me/skills/search?q=React");

      TestHelpers.validateApiResponse(response, 401);
    });
  });

  describe("30-skill limit enforcement", () => {
    let cookie: string;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;
    });

    it("should return 400 when trying to add 31st skill", async () => {
      // Link 30 skills with unique names
      for (let i = 1; i <= 30; i++) {
        const res = await request
          .post("/api/users/me/skills")
          .set("Cookie", cookie)
          .send({ skillName: `Skill ${i}` });

        expect(res.status).toBe(201);
      }

      // Attempt to add the 31st skill
      const response = await request
        .post("/api/users/me/skills")
        .set("Cookie", cookie)
        .send({ skillName: "Skill 31" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });
  });
});
