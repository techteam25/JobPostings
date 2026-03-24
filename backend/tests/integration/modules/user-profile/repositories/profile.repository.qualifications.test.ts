import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "@shared/db/connection";
import {
  skills,
  userSkills,
  userCertifications,
  educations,
  workExperiences,
} from "@/db/schema";
import { ProfileRepository } from "@/modules/user-profile/repositories/profile.repository";
import { createUser, createUserProfile } from "@tests/utils/seedBuilders";
import { NotFoundError } from "@shared/errors";

describe("ProfileRepository - Individual Qualification CRUD", () => {
  let repository: ProfileRepository;

  beforeAll(() => {
    repository = new ProfileRepository();
  });

  // Helper to set up a user with a profile, returns userProfileId
  async function seedUserWithProfile() {
    const user = await createUser();
    const profile = await createUserProfile(user.id);
    return { userId: user.id, userProfileId: profile.id };
  }

  // Helper to seed a skill in the master skills table
  async function seedSkill(name: string = "TypeScript") {
    const [result] = await db.insert(skills).values({ name }).$returningId();
    return result!.id;
  }

  // ─── Education ────────────────────────────────────────────────────────

  describe("Education CRUD", () => {
    const educationData = {
      schoolName: "MIT",
      program: "Bachelors" as const,
      major: "Computer Science",
      graduated: true,
      startDate: "2015-08-15T00:00:00.000Z",
      endDate: "2019-05-20T00:00:00.000Z",
    };

    it("addEducation should insert and return the education row", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const result = await repository.addEducation(
        userProfileId,
        educationData,
      );

      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
      expect(result.schoolName).toBe("MIT");
      expect(result.program).toBe("Bachelors");
      expect(result.major).toBe("Computer Science");
      expect(result.graduated).toBe(true);
      expect(result.userProfileId).toBe(userProfileId);
    });

    it("updateEducation should modify fields and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const edu = await repository.addEducation(userProfileId, educationData);

      const updated = await repository.updateEducation(edu.id, {
        schoolName: "Stanford",
        major: "Mathematics",
      });

      expect(updated).toBe(true);

      const row = await db.query.educations.findFirst({
        where: eq(educations.id, edu.id),
      });
      expect(row!.schoolName).toBe("Stanford");
      expect(row!.major).toBe("Mathematics");
    });

    it("updateEducation should throw NotFoundError for non-existent id", async () => {
      await expect(
        repository.updateEducation(99999, { schoolName: "Harvard" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("deleteEducation should remove the row and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const edu = await repository.addEducation(userProfileId, educationData);

      const deleted = await repository.deleteEducation(edu.id);
      expect(deleted).toBe(true);

      const row = await db.query.educations.findFirst({
        where: eq(educations.id, edu.id),
      });
      expect(row).toBeUndefined();
    });

    it("deleteEducation should throw NotFoundError for non-existent id", async () => {
      await expect(repository.deleteEducation(99999)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  // ─── Work Experience ──────────────────────────────────────────────────

  describe("Work Experience CRUD", () => {
    const workExpData = {
      companyName: "Acme Corp",
      jobTitle: "Senior Engineer",
      description: "Led a team of 5 engineers",
      current: false,
      startDate: "2020-01-01T00:00:00.000Z",
      endDate: "2023-06-30T00:00:00.000Z",
    };

    it("addWorkExperience should insert with jobTitle and description", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const result = await repository.addWorkExperience(
        userProfileId,
        workExpData,
      );

      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
      expect(result.companyName).toBe("Acme Corp");
      expect(result.jobTitle).toBe("Senior Engineer");
      expect(result.description).toBe("Led a team of 5 engineers");
      expect(result.current).toBe(false);
      expect(result.userProfileId).toBe(userProfileId);
    });

    it("updateWorkExperience should update jobTitle and description", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const we = await repository.addWorkExperience(userProfileId, workExpData);

      const updated = await repository.updateWorkExperience(we.id, {
        jobTitle: "Staff Engineer",
        description: "Promoted to staff",
      });

      expect(updated).toBe(true);

      const row = await db.query.workExperiences.findFirst({
        where: eq(workExperiences.id, we.id),
      });
      expect(row!.jobTitle).toBe("Staff Engineer");
      expect(row!.description).toBe("Promoted to staff");
    });

    it("updateWorkExperience should throw NotFoundError for non-existent id", async () => {
      await expect(
        repository.updateWorkExperience(99999, { jobTitle: "CTO" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("deleteWorkExperience should remove the row and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const we = await repository.addWorkExperience(userProfileId, workExpData);

      const deleted = await repository.deleteWorkExperience(we.id);
      expect(deleted).toBe(true);

      const row = await db.query.workExperiences.findFirst({
        where: eq(workExperiences.id, we.id),
      });
      expect(row).toBeUndefined();
    });

    it("deleteWorkExperience should throw NotFoundError for non-existent id", async () => {
      await expect(repository.deleteWorkExperience(99999)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  // ─── Certification ────────────────────────────────────────────────────

  describe("Certification link/unlink", () => {
    it("linkCertification should create certification and junction entry", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const cert = await repository.linkCertification(userProfileId, {
        certificationName: "AWS Solutions Architect",
      });

      expect(cert).toBeDefined();
      expect(cert.id).toBeGreaterThan(0);
      expect(cert.certificationName).toBe("AWS Solutions Architect");

      // Verify junction entry exists
      const junction = await db.query.userCertifications.findFirst({
        where: eq(userCertifications.userId, userProfileId),
      });
      expect(junction).toBeDefined();
      expect(junction!.certificationId).toBe(cert.id);
    });

    it("linkCertification should be idempotent", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const cert1 = await repository.linkCertification(userProfileId, {
        certificationName: "AWS Solutions Architect",
      });
      const cert2 = await repository.linkCertification(userProfileId, {
        certificationName: "AWS Solutions Architect",
      });

      // Same certification name returned both times
      expect(cert1.certificationName).toBe(cert2.certificationName);
    });

    it("unlinkCertification should remove junction entry and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const cert = await repository.linkCertification(userProfileId, {
        certificationName: "AWS Solutions Architect",
      });

      const result = await repository.unlinkCertification(
        userProfileId,
        cert.id,
      );
      expect(result).toBe(true);

      // Verify junction entry is gone
      const junction = await db.query.userCertifications.findFirst({
        where: eq(userCertifications.userId, userProfileId),
      });
      expect(junction).toBeUndefined();
    });

    it("unlinkCertification should throw NotFoundError for missing link", async () => {
      const { userProfileId } = await seedUserWithProfile();

      await expect(
        repository.unlinkCertification(userProfileId, 99999),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ─── Skill ────────────────────────────────────────────────────────────

  describe("Skill link/unlink", () => {
    it("linkSkill should create junction entry for existing skill", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const skillId = await seedSkill("TypeScript");

      const result = await repository.linkSkill(userProfileId, skillId);
      expect(result).toBe(true);

      // Verify junction entry exists
      const junction = await db.query.userSkills.findFirst({
        where: eq(userSkills.userProfileId, userProfileId),
      });
      expect(junction).toBeDefined();
      expect(junction!.skillId).toBe(skillId);
    });

    it("linkSkill should throw NotFoundError for non-existent skill", async () => {
      const { userProfileId } = await seedUserWithProfile();

      await expect(repository.linkSkill(userProfileId, 99999)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("linkSkill should be idempotent", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const skillId = await seedSkill("React");

      await repository.linkSkill(userProfileId, skillId);
      const result = await repository.linkSkill(userProfileId, skillId);

      expect(result).toBe(true);
    });

    it("unlinkSkill should remove junction entry and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const skillId = await seedSkill("Node.js");

      await repository.linkSkill(userProfileId, skillId);
      const result = await repository.unlinkSkill(userProfileId, skillId);
      expect(result).toBe(true);

      // Verify junction entry is gone
      const junction = await db.query.userSkills.findFirst({
        where: eq(userSkills.userProfileId, userProfileId),
      });
      expect(junction).toBeUndefined();
    });

    it("unlinkSkill should throw NotFoundError for missing link", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const skillId = await seedSkill("Python");

      await expect(
        repository.unlinkSkill(userProfileId, skillId),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ─── updateProfile bug fix verification ───────────────────────────────

  describe("updateProfile - jobTitle/description persistence", () => {
    it("should persist jobTitle and description on work experience upsert", async () => {
      const { userId } = await seedUserWithProfile();

      // First updateProfile with work experience including jobTitle + description
      const result = await repository.updateProfile(userId, {
        educations: [],
        certifications: [],
        workExperiences: [
          {
            companyName: "Acme Corp",
            jobTitle: "Engineer",
            description: "Building things",
            current: false,
            startDate: "2020-01-01T00:00:00.000Z",
            endDate: "2023-01-01T00:00:00.000Z",
          },
        ],
      });

      expect(result).toBeDefined();
      const workExp = result!.profile!.workExperiences![0];
      expect(workExp!.jobTitle).toBe("Engineer");
      expect(workExp!.description).toBe("Building things");

      // Second upsert with updated jobTitle/description (triggers onDuplicateKeyUpdate)
      const result2 = await repository.updateProfile(userId, {
        educations: [],
        certifications: [],
        workExperiences: [
          {
            id: workExp!.id,
            companyName: "Acme Corp",
            jobTitle: "Senior Engineer",
            description: "Leading the team",
            current: false,
            startDate: "2020-01-01T00:00:00.000Z",
            endDate: "2023-01-01T00:00:00.000Z",
          },
        ],
      });

      const updatedWorkExp = result2!.profile!.workExperiences![0];
      expect(updatedWorkExp!.jobTitle).toBe("Senior Engineer");
      expect(updatedWorkExp!.description).toBe("Leading the team");
    });
  });
});
