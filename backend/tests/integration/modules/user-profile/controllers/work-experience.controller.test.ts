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

const validWorkExperience = {
  companyName: "Acme Corp",
  jobTitle: "Software Engineer",
  description: "<p>Built and maintained web applications.</p>",
  current: false,
  startDate: "2020-01-15T00:00:00Z",
  endDate: "2023-06-30T00:00:00Z",
};

async function seedAndLogin() {
  const user = await createUser({
    email: "we-test@example.com",
    password: "Password@123",
    name: "WE Test",
  });
  await createUserProfile(user.id);

  const loginResponse = await request
    .post("/api/auth/sign-in/email")
    .send({ email: user.email, password: "Password@123" });

  const cookie = loginResponse.headers["set-cookie"]?.[0] ?? "";

  return { user, cookie };
}

describe("Work Experience Controller Integration Tests", () => {
  describe("POST /api/users/me/work-experiences/batch", () => {
    let cookie: string;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;
    });

    it("should create multiple work experience entries returning 201", async () => {
      const response = await request
        .post("/api/users/me/work-experiences/batch")
        .set("Cookie", cookie)
        .send({
          workExperiences: [
            validWorkExperience,
            {
              companyName: "Tech Startup",
              jobTitle: "Lead Developer",
              current: true,
              startDate: "2023-07-01T00:00:00Z",
            },
          ],
        });

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Work experience entries added successfully",
      );
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty("companyName", "Acme Corp");
      expect(response.body.data[0]).toHaveProperty(
        "jobTitle",
        "Software Engineer",
      );
      expect(response.body.data[1]).toHaveProperty(
        "companyName",
        "Tech Startup",
      );
    });

    it("should create a single work experience entry returning 201", async () => {
      const response = await request
        .post("/api/users/me/work-experiences/batch")
        .set("Cookie", cookie)
        .send({ workExperiences: [validWorkExperience] });

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty("companyName", "Acme Corp");
      expect(response.body.data[0]).toHaveProperty(
        "jobTitle",
        "Software Engineer",
      );
      expect(response.body.data[0]).toHaveProperty("id");
    });

    it("should create a current work experience without endDate returning 201", async () => {
      const response = await request
        .post("/api/users/me/work-experiences/batch")
        .set("Cookie", cookie)
        .send({
          workExperiences: [
            {
              companyName: "Current Inc",
              jobTitle: "Senior Developer",
              current: true,
              startDate: "2023-01-01T00:00:00Z",
            },
          ],
        });

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data[0]).toHaveProperty("current", true);
      expect(response.body.data[0].endDate).toBeNull();
    });

    it("should fail with 400 when workExperiences array is empty", async () => {
      const response = await request
        .post("/api/users/me/work-experiences/batch")
        .set("Cookie", cookie)
        .send({ workExperiences: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with 400 when companyName is missing", async () => {
      const response = await request
        .post("/api/users/me/work-experiences/batch")
        .set("Cookie", cookie)
        .send({
          workExperiences: [
            {
              jobTitle: "Developer",
              current: false,
              startDate: "2020-01-01T00:00:00Z",
              endDate: "2023-01-01T00:00:00Z",
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with 400 when jobTitle is missing", async () => {
      const response = await request
        .post("/api/users/me/work-experiences/batch")
        .set("Cookie", cookie)
        .send({
          workExperiences: [
            {
              companyName: "Test Corp",
              current: false,
              startDate: "2020-01-01T00:00:00Z",
              endDate: "2023-01-01T00:00:00Z",
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with 401 when not authenticated", async () => {
      const response = await request
        .post("/api/users/me/work-experiences/batch")
        .send({ workExperiences: [validWorkExperience] });

      TestHelpers.validateApiResponse(response, 401);
    });
  });

  describe("PUT /api/users/me/work-experiences/:workExperienceId", () => {
    let workExperienceId: number;
    let cookie: string;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;

      // Create a work experience entry to update
      const createResponse = await request
        .post("/api/users/me/work-experiences/batch")
        .set("Cookie", cookie)
        .send({ workExperiences: [validWorkExperience] });

      workExperienceId = createResponse.body.data[0].id;
    });

    it("should update an existing work experience returning 200", async () => {
      const response = await request
        .put(`/api/users/me/work-experiences/${workExperienceId}`)
        .set("Cookie", cookie)
        .send({ companyName: "New Corp", jobTitle: "Senior Engineer" });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Work experience updated successfully",
      );
    });

    it("should fail with 404 when work experience does not exist", async () => {
      const response = await request
        .put("/api/users/me/work-experiences/99999")
        .set("Cookie", cookie)
        .send({ companyName: "New Corp" });

      TestHelpers.validateApiResponse(response, 404);
    });

    it("should fail with 400 when workExperienceId is not a number", async () => {
      const response = await request
        .put("/api/users/me/work-experiences/abc")
        .set("Cookie", cookie)
        .send({ companyName: "New Corp" });

      expect(response.status).toBe(400);
    });

    it("should fail with 401 when not authenticated", async () => {
      const response = await request
        .put(`/api/users/me/work-experiences/${workExperienceId}`)
        .send({ companyName: "New Corp" });

      TestHelpers.validateApiResponse(response, 401);
    });
  });

  describe("DELETE /api/users/me/work-experiences/:workExperienceId", () => {
    let cookie: string;
    let workExperienceId: number;

    beforeEach(async () => {
      const result = await seedAndLogin();
      cookie = result.cookie;

      // Create a work experience entry to delete
      const createResponse = await request
        .post("/api/users/me/work-experiences/batch")
        .set("Cookie", cookie)
        .send({ workExperiences: [validWorkExperience] });

      workExperienceId = createResponse.body.data[0].id;
    });

    it("should delete an existing work experience returning 200", async () => {
      const response = await request
        .delete(`/api/users/me/work-experiences/${workExperienceId}`)
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Work experience deleted successfully",
      );
    });

    it("should fail with 404 when work experience does not exist", async () => {
      const response = await request
        .delete("/api/users/me/work-experiences/99999")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 404);
    });

    it("should fail with 401 when not authenticated", async () => {
      const response = await request.delete(
        `/api/users/me/work-experiences/${workExperienceId}`,
      );

      TestHelpers.validateApiResponse(response, 401);
    });
  });
});
