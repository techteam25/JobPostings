import { vi } from "vitest";
import { request } from "@tests/utils/testHelpers";
import {
  seedAdminScenario,
  seedUserScenario,
} from "@tests/utils/seedScenarios";
import { createUser, createUserProfile } from "@tests/utils/seedBuilders";
import { createTestDatabase } from "@tests/utils/testDatabase";
import { educations, workExperiences } from "@/db/schema";

const profileUrl = (userId: number) =>
  `/api/organizations/candidates/${userId}`;

const { db } = createTestDatabase();

async function signInAsEmployer(): Promise<string> {
  await seedAdminScenario();
  const res = await request
    .post("/api/auth/sign-in/email")
    .send({ email: "admin.user@example.com", password: "Password@123" })
    .expect(200);
  const cookie = res.headers["set-cookie"]?.[0];
  if (!cookie) {
    throw new Error("Missing session cookie after employer sign-in");
  }
  return cookie;
}

async function signInAsNonEmployer(): Promise<string> {
  await seedUserScenario();
  const res = await request
    .post("/api/auth/sign-in/email")
    .send({ email: "normal.user@example.com", password: "Password@123" });
  return res.headers["set-cookie"]![0]!;
}

async function seedPublicSeeker() {
  const seeker = await createUser({
    email: "public.seeker@example.com",
    name: "Public Seeker",
  });
  const profile = await createUserProfile(seeker.id, {
    isProfilePublic: true,
    bio: "Mission-minded software engineer.",
    city: "Austin",
    state: "TX",
    country: "USA",
    phoneNumber: "+1-555-0100",
  });

  await db.insert(workExperiences).values({
    userProfileId: profile.id,
    companyName: "Mission Tech",
    jobTitle: "Software Engineer",
    description: "Built internal tools.",
    current: true,
    startDate: new Date("2020-01-01T00:00:00Z"),
    endDate: null,
  });

  await db.insert(educations).values({
    userProfileId: profile.id,
    schoolName: "Faith University",
    program: "Bachelors",
    major: "Computer Science",
    graduated: true,
    startDate: new Date("2012-08-15T00:00:00Z"),
    endDate: new Date("2016-05-20T00:00:00Z"),
  });

  return seeker;
}

describe("Candidate profile integration tests", () => {
  vi.setConfig({ testTimeout: 30_000 });

  let employerCookie: string;

  beforeEach(async () => {
    employerCookie = await signInAsEmployer();
  });

  it("returns 401 when unauthenticated", async () => {
    const seeker = await seedPublicSeeker();

    const response = await request.get(profileUrl(seeker.id)).expect(401);

    expect(response.body).toHaveProperty("success", false);
  });

  it("returns 403 when authenticated but user has no job-posting role", async () => {
    const seeker = await seedPublicSeeker();
    const nonEmployerCookie = await signInAsNonEmployer();

    const response = await request
      .get(profileUrl(seeker.id))
      .set("Cookie", nonEmployerCookie)
      .expect(403);

    expect(response.body).toHaveProperty("success", false);
  });

  it("returns 404 for a private profile", async () => {
    const seeker = await createUser({
      email: "private.seeker@example.com",
      name: "Private Seeker",
    });
    await createUserProfile(seeker.id, { isProfilePublic: false });

    await request
      .get(profileUrl(seeker.id))
      .set("Cookie", employerCookie)
      .expect(404);
  });

  it("returns the allowlisted public profile for a public seeker", async () => {
    const seeker = await seedPublicSeeker();

    const response = await request
      .get(profileUrl(seeker.id))
      .set("Cookie", employerCookie)
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body.data).toMatchObject({
      userId: seeker.id,
      name: "Public Seeker",
      bio: "Mission-minded software engineer.",
      location: "Austin, TX, USA",
      openToWork: expect.any(Boolean),
    });
    expect(response.body.data.workExperiences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          companyName: "Mission Tech",
          jobTitle: "Software Engineer",
        }),
      ]),
    );
    expect(response.body.data.educations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schoolName: "Faith University",
          major: "Computer Science",
        }),
      ]),
    );
    expect(response.body.data).not.toHaveProperty("email");
    expect(response.body.data).not.toHaveProperty("phoneNumber");
    expect(response.body.data).not.toHaveProperty("resumeUrl");
  });
});
