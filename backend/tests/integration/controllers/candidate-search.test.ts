import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request } from "@tests/utils/testHelpers";
import { db } from "@/db/connection";
import {
  user,
  userProfile,
  userOnBoarding,
  educations,
  workExperiences,
  organizationMembers,
  organizations,
} from "@/db/schema";
import { auth } from "@/utils/auth";
import { sql } from "drizzle-orm";

describe("GET /api/users/candidates/search", () => {
  let orgCookie: string;
  let nonOrgCookie: string;

  beforeAll(async () => {
    // 1. Clean Database
    await db.delete(workExperiences);
    await db.delete(educations);
    await db.delete(userOnBoarding);
    await db.delete(userProfile);
    await db.delete(organizationMembers);
    await db.delete(organizations);
    await db.delete(user);
    
    // Reset auto-increments to ensure consistent IDs implies easier debugging, 
    // but strict ID dependency is bad practice. We will capture IDs dynamically.

    // 2. Create Organization User (Owner)
    const orgUser = await auth.api.signUpEmail({
      body: {
        email: "org.recruiter@example.com",
        password: "Password@123",
        name: "Recruiter Bob",
        image: "avatar.png",
      },
    });

    const orgSignIn = await request
      .post("/api/auth/sign-in/email")
      .send({ email: "org.recruiter@example.com", password: "Password@123" });
    
    orgCookie = orgSignIn.headers["set-cookie"]![0];

    // Create Organization and Membership
    const [org] = await db.insert(organizations).values({
      name: "Tech Corp",
      slug: "tech-corp",
    }).$returningId();
    
    await db.insert(organizationMembers).values({
        userId: Number(orgUser.user.id),
        organizationId: org.id!, // ! assertions if we are sure
        role: "recruiter",
        isActive: true
    });

    // 3. Create Non-Organization User
    const regularUser = await auth.api.signUpEmail({
        body: {
          email: "regular.joe@example.com",
          password: "Password@123",
          name: "Joe Regular",
          image: "avatar.png",
        },
    });
    const regularSignIn = await request
        .post("/api/auth/sign-in/email")
        .send({ email: "regular.joe@example.com", password: "Password@123" });
    nonOrgCookie = regularSignIn.headers["set-cookie"]![0];


    // 4. Seed Candidates
    
    // Helper to create candidate
    const createCandidate = async (
        email: string, 
        name: string, 
        profile: any, 
        intent: "seeker" | "employer" = "seeker",
        edu: any[] = [],
        work: any[] = []
    ) => {
        const u = await auth.api.signUpEmail({
             body: { email, password: "Password@123", name, image: null }
        });
        const uid = Number(u.user.id);
        
        await db.insert(userOnBoarding).values({ userId: uid, intent, status: "completed" });
        
        const [prof] = await db.insert(userProfile).values({ ...profile, userId: uid }).$returningId();
        
        if (edu.length) {
            await db.insert(educations).values(edu.map(e => ({ ...e, userProfileId: prof.id })));
        }
        if (work.length) {
            await db.insert(workExperiences).values(work.map(w => ({ ...w, userProfileId: prof.id })));
        }
    };

    // Candidate A: Matching most filters (Austin, Developer, Available, Bachelors, Work Exp)
    await createCandidate(
        "alice@test.com", "Alice Dev", 
        { city: "Austin", state: "TX", country: "US", isAvailableForWork: true, isProfilePublic: true, bio: "Senior Java Developer" },
        "seeker",
        [{ schoolName: "UT Austin", program: "Bachelors", major: "CS", startDate: new Date("2015-01-01") }],
        [{ companyName: "Tech Co", startDate: new Date("2020-01-01"), current: true }]
    );

    // Candidate B: Matching some (Austin, Designer, Not Available, Masters, No Exp)
    await createCandidate(
        "bob@test.com", "Bob Design", 
        { city: "Austin", state: "TX", country: "US", isAvailableForWork: false, isProfilePublic: true, bio: "Creative Designer" },
        "seeker",
        [{ schoolName: "Art School", program: "Masters", major: "Design", startDate: new Date("2018-01-01") }],
        []
    );

    // Candidate C: Different location (NYC, Manager, Available, PhD, Exp)
    await createCandidate(
        "charlie@test.com", "Charlie Mgr", 
        { city: "New York", state: "NY", country: "US", isAvailableForWork: true, isProfilePublic: true, bio: "Project Manager" },
        "seeker",
        [{ schoolName: "NYU", program: "Doctorate", major: "MBA", startDate: new Date("2010-01-01") }],
        [{ companyName: "Big Corp", startDate: new Date("2015-01-01"), current: true }]
    );

    // Candidate D: Private Profile (Should be invisible)
    await createCandidate(
        "david@test.com", "David Private", 
        { city: "Austin", state: "TX", country: "US", isAvailableForWork: true, isProfilePublic: false, bio: "Secret Agent" },
        "seeker"
    );

    // Candidate E: Employer Intent (Should be invisible)
    await createCandidate(
        "eve@test.com", "Eve Employer", 
        { city: "Austin", state: "TX", country: "US", isAvailableForWork: true, isProfilePublic: true, bio: "Hiring Manager" },
        "employer"
    );
  });

  it("should return 401 if not authenticated", async () => {
    await request.get("/api/users/candidates/search").expect(401);
  });

  it("should return 400 (or 403 based on implementation) if user is not an organization member", async () => {
    // Current implementation throws ValidationError which 400s or 500s depending on handling. 
    // Wait, BaseController handles AppError. ValidationError usually maps to 400.
    // However, I put "Only organization members..." message.
    const res = await request
        .get("/api/users/candidates/search")
        .set("Cookie", nonOrgCookie)
        .expect(400); 

    expect(res.body.error.message).toContain("Only organization members");
  });

  it("should return candidates for organization member", async () => {
    const res = await request
        .get("/api/users/candidates/search")
        .set("Cookie", orgCookie)
        .expect(200);

    expect(res.body.data).toBeDefined();
    // Alice, Bob, Charlie should be visible. David (private) and Eve (employer) should not.
    expect(res.body.data.length).toBe(3);
  });

  it("should filter by city", async () => {
    const res = await request
        .get("/api/users/candidates/search")
        .query({ city: "Austin" })
        .set("Cookie", orgCookie)
        .expect(200);

    expect(res.body.data.length).toBe(2); // Alice and Bob
    const names = res.body.data.map((c: any) => c.fullName).sort();
    expect(names).toEqual(["Alice Dev", "Bob Design"]);
  });

  it("should filter by availability", async () => {
    const res = await request
        .get("/api/users/candidates/search")
        .query({ isAvailableForWork: 1 }) // true passed as string/number usually works with z.coerce.boolean
        .set("Cookie", orgCookie)
        .expect(200);

    // Alice and Charlie are available
    expect(res.body.data.length).toBe(2);
    const names = res.body.data.map((c: any) => c.fullName).sort();
    expect(names).toEqual(["Alice Dev", "Charlie Mgr"]);
  });

  it("should filter by education level", async () => {
    const res = await request
        .get("/api/users/candidates/search")
        .query({ educationLevel: "Bachelors" })
        .set("Cookie", orgCookie)
        .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].fullName).toBe("Alice Dev");
  });

  it("should filter by hasWorkExperience = true", async () => {
    const res = await request
        .get("/api/users/candidates/search")
        .query({ hasWorkExperience: true })
        .set("Cookie", orgCookie)
        .expect(200);

    // Alice and Charlie have work experience
    expect(res.body.data.length).toBe(2);
    const names = res.body.data.map((c: any) => c.fullName).sort();
    expect(names).toEqual(["Alice Dev", "Charlie Mgr"]);
  });

  it("should filter by text query (q)", async () => {
    const res = await request
        .get("/api/users/candidates/search")
        .query({ q: "Creative" }) // Matches Bob's bio
        .set("Cookie", orgCookie)
        .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].fullName).toBe("Bob Design");
  });

  it("should combine filters", async () => {
    const res = await request
        .get("/api/users/candidates/search")
        .query({ city: "Austin", isAvailableForWork: true })
        .set("Cookie", orgCookie)
        .expect(200);

    // Only Alice matches both
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].fullName).toBe("Alice Dev");
  });

  it("should apply pagination", async () => {
     const res = await request
        .get("/api/users/candidates/search")
        .query({ limit: 1 })
        .set("Cookie", orgCookie)
        .expect(200);

     expect(res.body.data.length).toBe(1);
     expect(res.body.pagination.total).toBe(3);
     expect(res.body.pagination.totalPages).toBe(3);
  });
});
