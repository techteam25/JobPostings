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
    email: "cert-test@example.com",
    password: "Password@123",
    name: "Cert Test",
  });
  await createUserProfile(user.id);

  const loginResponse = await request
    .post("/api/auth/sign-in/email")
    .send({ email: user.email, password: "Password@123" });

  const cookie = loginResponse.headers["set-cookie"]?.[0] ?? "";

  return { user, cookie };
}

describe("Certification Controller Integration Tests", () => {
  describe("POST /api/users/me/certifications", () => {
    let cookie: string;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;
    });

    it("should link a new certification returning 201", async () => {
      const response = await request
        .post("/api/users/me/certifications")
        .set("Cookie", cookie)
        .send({ certificationName: "AWS Solutions Architect" });

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Certification linked successfully",
      );
      expect(response.body.data).toHaveProperty(
        "certificationName",
        "AWS Solutions Architect",
      );
      expect(response.body.data).toHaveProperty("id");
    });

    it("should be idempotent when linking the same certification twice", async () => {
      await request
        .post("/api/users/me/certifications")
        .set("Cookie", cookie)
        .send({ certificationName: "AWS Solutions Architect" });

      const response = await request
        .post("/api/users/me/certifications")
        .set("Cookie", cookie)
        .send({ certificationName: "AWS Solutions Architect" });

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveProperty(
        "certificationName",
        "AWS Solutions Architect",
      );
    });

    it("should fail with 400 when certificationName is missing", async () => {
      const response = await request
        .post("/api/users/me/certifications")
        .set("Cookie", cookie)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with 400 when certificationName is empty", async () => {
      const response = await request
        .post("/api/users/me/certifications")
        .set("Cookie", cookie)
        .send({ certificationName: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with 401 when not authenticated", async () => {
      const response = await request
        .post("/api/users/me/certifications")
        .send({ certificationName: "AWS Solutions Architect" });

      TestHelpers.validateApiResponse(response, 401);
    });
  });

  describe("DELETE /api/users/me/certifications/:certificationId", () => {
    let cookie: string;
    let certificationId: number;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;

      // Link a certification to unlink later
      const createResponse = await request
        .post("/api/users/me/certifications")
        .set("Cookie", cookie)
        .send({ certificationName: "AWS Solutions Architect" });

      certificationId = createResponse.body.data.id;
    });

    it("should unlink an existing certification returning 200", async () => {
      const response = await request
        .delete(`/api/users/me/certifications/${certificationId}`)
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Certification unlinked successfully",
      );
    });

    it("should fail with 404 when certification link does not exist", async () => {
      const response = await request
        .delete("/api/users/me/certifications/99999")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 404);
    });

    it("should fail with 400 when certificationId is not a number", async () => {
      const response = await request
        .delete("/api/users/me/certifications/abc")
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
    });

    it("should fail with 401 when not authenticated", async () => {
      const response = await request.delete(
        `/api/users/me/certifications/${certificationId}`,
      );

      TestHelpers.validateApiResponse(response, 401);
    });
  });

  describe("GET /api/users/me/certifications/search", () => {
    let cookie: string;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;

      // Seed some certifications via link
      await request
        .post("/api/users/me/certifications")
        .set("Cookie", cookie)
        .send({ certificationName: "AWS Solutions Architect" });
      await request
        .post("/api/users/me/certifications")
        .set("Cookie", cookie)
        .send({ certificationName: "AWS Developer Associate" });
      await request
        .post("/api/users/me/certifications")
        .set("Cookie", cookie)
        .send({ certificationName: "Google Cloud Professional" });
    });

    it("should return matching certifications", async () => {
      const response = await request
        .get("/api/users/me/certifications/search?q=AWS")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(
        response.body.data.every((c: { certificationName: string }) =>
          c.certificationName.includes("AWS"),
        ),
      ).toBe(true);
    });

    it("should return empty array for no matches", async () => {
      const response = await request
        .get("/api/users/me/certifications/search?q=NonExistent")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data).toHaveLength(0);
    });

    it("should fail with 400 when query is missing", async () => {
      const response = await request
        .get("/api/users/me/certifications/search")
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
    });

    it("should fail with 401 when not authenticated", async () => {
      const response = await request.get(
        "/api/users/me/certifications/search?q=AWS",
      );

      TestHelpers.validateApiResponse(response, 401);
    });
  });
});
