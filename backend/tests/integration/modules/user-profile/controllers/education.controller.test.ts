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

const validEducation = {
  schoolName: "MIT",
  program: "Bachelors",
  major: "Computer Science",
  graduated: true,
  startDate: "2015-08-15T00:00:00Z",
  endDate: "2019-05-20T00:00:00Z",
};

async function seedAndLogin() {
  const user = await createUser({
    email: "edu-test@example.com",
    password: "Password@123",
    name: "Edu Test",
  });
  await createUserProfile(user.id);

  const loginResponse = await request
    .post("/api/auth/sign-in/email")
    .send({ email: user.email, password: "Password@123" });

  const cookie = loginResponse.headers["set-cookie"]?.[0] ?? "";

  return { user, cookie };
}

describe("Education Controller Integration Tests", () => {
  describe("POST /api/users/me/educations/batch", () => {
    let cookie: string;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;
    });

    it("should create multiple education entries returning 201", async () => {
      const response = await request
        .post("/api/users/me/educations/batch")
        .set("Cookie", cookie)
        .send({
          educations: [
            validEducation,
            {
              schoolName: "Stanford",
              program: "Masters",
              major: "Mathematics",
              graduated: false,
              startDate: "2020-09-01T00:00:00Z",
            },
          ],
        });

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Education entries added successfully",
      );
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty("schoolName", "MIT");
      expect(response.body.data[1]).toHaveProperty("schoolName", "Stanford");
    });

    it("should create a single education entry returning 201", async () => {
      const response = await request
        .post("/api/users/me/educations/batch")
        .set("Cookie", cookie)
        .send({ educations: [validEducation] });

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty("schoolName", "MIT");
      expect(response.body.data[0]).toHaveProperty("id");
    });

    it("should fail with 400 when educations array is empty", async () => {
      const response = await request
        .post("/api/users/me/educations/batch")
        .set("Cookie", cookie)
        .send({ educations: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with 400 when schoolName is missing", async () => {
      const response = await request
        .post("/api/users/me/educations/batch")
        .set("Cookie", cookie)
        .send({
          educations: [
            {
              program: "Bachelors",
              major: "CS",
              graduated: false,
              startDate: "2020-01-01T00:00:00Z",
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with 401 when not authenticated", async () => {
      const response = await request
        .post("/api/users/me/educations/batch")
        .send({ educations: [validEducation] });

      TestHelpers.validateApiResponse(response, 401);
    });
  });

  describe("PUT /api/users/me/educations/:educationId", () => {
    let educationId: number;
    let cookie: string;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;

      // Create an education entry to update
      const createResponse = await request
        .post("/api/users/me/educations/batch")
        .set("Cookie", cookie)
        .send({ educations: [validEducation] });

      educationId = createResponse.body.data[0].id;
    });

    it("should update an existing education returning 200", async () => {
      const response = await request
        .put(`/api/users/me/educations/${educationId}`)
        .set("Cookie", cookie)
        .send({ schoolName: "Harvard", major: "Physics" });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Education updated successfully",
      );
    });

    it("should fail with 404 when education does not exist", async () => {
      const response = await request
        .put("/api/users/me/educations/99999")
        .set("Cookie", cookie)
        .send({ schoolName: "Harvard" });

      TestHelpers.validateApiResponse(response, 404);
    });

    it("should fail with 400 when educationId is not a number", async () => {
      const response = await request
        .put("/api/users/me/educations/abc")
        .set("Cookie", cookie)
        .send({ schoolName: "Harvard" });

      expect(response.status).toBe(400);
    });

    it("should fail with 401 when not authenticated", async () => {
      const response = await request
        .put(`/api/users/me/educations/${educationId}`)
        .send({ schoolName: "Harvard" });

      TestHelpers.validateApiResponse(response, 401);
    });
  });

  describe("DELETE /api/users/me/educations/:educationId", () => {
    let cookie: string;
    let educationId: number;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;

      // Create an education entry to delete
      const createResponse = await request
        .post("/api/users/me/educations/batch")
        .set("Cookie", cookie)
        .send({ educations: [validEducation] });

      educationId = createResponse.body.data[0].id;
    });

    it("should delete an existing education returning 200", async () => {
      const response = await request
        .delete(`/api/users/me/educations/${educationId}`)
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Education deleted successfully",
      );
    });

    it("should fail with 404 when education does not exist", async () => {
      const response = await request
        .delete("/api/users/me/educations/99999")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 404);
    });

    it("should fail with 401 when not authenticated", async () => {
      const response = await request.delete(
        `/api/users/me/educations/${educationId}`,
      );

      TestHelpers.validateApiResponse(response, 401);
    });
  });
});
