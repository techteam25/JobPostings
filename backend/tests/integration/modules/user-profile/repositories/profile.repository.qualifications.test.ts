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
import { EducationRepository } from "@/modules/user-profile/repositories/education.repository";
import { WorkExperienceRepository } from "@/modules/user-profile/repositories/work-experience.repository";
import { CertificationRepository } from "@/modules/user-profile/repositories/certification.repository";
import { SkillRepository } from "@/modules/user-profile/repositories/skill.repository";
import { createUser, createUserProfile } from "@tests/utils/seedBuilders";
import { NotFoundError } from "@shared/errors";

describe("Qualification Repositories - Individual CRUD", () => {
  let profileRepository: ProfileRepository;
  let educationRepository: EducationRepository;
  let workExperienceRepository: WorkExperienceRepository;
  let certificationRepository: CertificationRepository;
  let skillRepository: SkillRepository;

  beforeAll(() => {
    profileRepository = new ProfileRepository();
    educationRepository = new EducationRepository();
    workExperienceRepository = new WorkExperienceRepository();
    certificationRepository = new CertificationRepository();
    skillRepository = new SkillRepository();
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

    it("batchAddEducations should insert and return the education rows", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const result = await educationRepository.batchAddEducations(
        userProfileId,
        [educationData],
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBeGreaterThan(0);
      expect(result[0]!.schoolName).toBe("MIT");
      expect(result[0]!.program).toBe("Bachelors");
      expect(result[0]!.major).toBe("Computer Science");
      expect(result[0]!.graduated).toBe(true);
      expect(result[0]!.userProfileId).toBe(userProfileId);
    });

    it("updateEducation should modify fields and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const [edu] = await educationRepository.batchAddEducations(
        userProfileId,
        [educationData],
      );

      const updated = await educationRepository.updateEducation(edu!.id, {
        schoolName: "Stanford",
        major: "Mathematics",
      });

      expect(updated).toBe(true);

      const row = await db.query.educations.findFirst({
        where: eq(educations.id, edu!.id),
      });
      expect(row!.schoolName).toBe("Stanford");
      expect(row!.major).toBe("Mathematics");
    });

    it("updateEducation should throw NotFoundError for non-existent id", async () => {
      await expect(
        educationRepository.updateEducation(99999, { schoolName: "Harvard" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("deleteEducation should remove the row and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const [edu] = await educationRepository.batchAddEducations(
        userProfileId,
        [educationData],
      );

      const deleted = await educationRepository.deleteEducation(edu!.id);
      expect(deleted).toBe(true);

      const row = await db.query.educations.findFirst({
        where: eq(educations.id, edu!.id),
      });
      expect(row).toBeUndefined();
    });

    it("deleteEducation should throw NotFoundError for non-existent id", async () => {
      await expect(educationRepository.deleteEducation(99999)).rejects.toThrow(
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

    it("batchAddWorkExperiences should insert with jobTitle and description", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const result = await workExperienceRepository.batchAddWorkExperiences(
        userProfileId,
        [workExpData],
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBeGreaterThan(0);
      expect(result[0]!.companyName).toBe("Acme Corp");
      expect(result[0]!.jobTitle).toBe("Senior Engineer");
      expect(result[0]!.description).toBe("Led a team of 5 engineers");
      expect(result[0]!.current).toBe(false);
      expect(result[0]!.userProfileId).toBe(userProfileId);
    });

    it("updateWorkExperience should update jobTitle and description", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const [we] = await workExperienceRepository.batchAddWorkExperiences(
        userProfileId,
        [workExpData],
      );

      const updated = await workExperienceRepository.updateWorkExperience(
        we!.id,
        {
          jobTitle: "Staff Engineer",
          description: "Promoted to staff",
        },
      );

      expect(updated).toBe(true);

      const row = await db.query.workExperiences.findFirst({
        where: eq(workExperiences.id, we!.id),
      });
      expect(row!.jobTitle).toBe("Staff Engineer");
      expect(row!.description).toBe("Promoted to staff");
    });

    it("updateWorkExperience should throw NotFoundError for non-existent id", async () => {
      await expect(
        workExperienceRepository.updateWorkExperience(99999, {
          jobTitle: "CTO",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("deleteWorkExperience should remove the row and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const [we] = await workExperienceRepository.batchAddWorkExperiences(
        userProfileId,
        [workExpData],
      );

      const deleted = await workExperienceRepository.deleteWorkExperience(
        we!.id,
      );
      expect(deleted).toBe(true);

      const row = await db.query.workExperiences.findFirst({
        where: eq(workExperiences.id, we!.id),
      });
      expect(row).toBeUndefined();
    });

    it("deleteWorkExperience should throw NotFoundError for non-existent id", async () => {
      await expect(
        workExperienceRepository.deleteWorkExperience(99999),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ─── Certification ────────────────────────────────────────────────────

  describe("Certification link/unlink", () => {
    it("linkCertification should create certification and junction entry", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const cert = await certificationRepository.linkCertification(
        userProfileId,
        {
          certificationName: "AWS Solutions Architect",
        },
      );

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

      const cert1 = await certificationRepository.linkCertification(
        userProfileId,
        {
          certificationName: "AWS Solutions Architect",
        },
      );
      const cert2 = await certificationRepository.linkCertification(
        userProfileId,
        {
          certificationName: "AWS Solutions Architect",
        },
      );

      // Same certification name returned both times
      expect(cert1.certificationName).toBe(cert2.certificationName);
    });

    it("unlinkCertification should remove junction entry and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();
      const cert = await certificationRepository.linkCertification(
        userProfileId,
        {
          certificationName: "AWS Solutions Architect",
        },
      );

      const result = await certificationRepository.unlinkCertification(
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
        certificationRepository.unlinkCertification(userProfileId, 99999),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ─── Skill ────────────────────────────────────────────────────────────

  describe("Skill link/unlink", () => {
    it("linkSkill should create or find skill and create junction entry", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const result = await skillRepository.linkSkill(userProfileId, {
        name: "TypeScript",
      });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name", "TypeScript");

      // Verify junction entry exists
      const junction = await db.query.userSkills.findFirst({
        where: eq(userSkills.userProfileId, userProfileId),
      });
      expect(junction).toBeDefined();
      expect(junction!.skillId).toBe(result.id);
    });

    it("linkSkill should be idempotent", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const first = await skillRepository.linkSkill(userProfileId, {
        name: "React",
      });
      const second = await skillRepository.linkSkill(userProfileId, {
        name: "React",
      });

      expect(second.name).toBe("React");
      expect(second.id).toBe(first.id);
    });

    it("unlinkSkill should remove junction entry and return true", async () => {
      const { userProfileId } = await seedUserWithProfile();

      const skill = await skillRepository.linkSkill(userProfileId, {
        name: "Node.js",
      });
      const result = await skillRepository.unlinkSkill(userProfileId, skill.id);
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
        skillRepository.unlinkSkill(userProfileId, skillId),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("searchCertifications", () => {
    it("should return certifications matching query", async () => {
      const { userProfileId } = await seedUserWithProfile();

      // Seed certifications via link
      await certificationRepository.linkCertification(userProfileId, {
        certificationName: "AWS Solutions Architect",
      });
      await certificationRepository.linkCertification(userProfileId, {
        certificationName: "AWS Developer Associate",
      });
      await certificationRepository.linkCertification(userProfileId, {
        certificationName: "Google Cloud Professional",
      });

      const results = await certificationRepository.searchCertifications("AWS");

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every((c) => c.certificationName.includes("AWS"))).toBe(
        true,
      );
    });

    it("should return empty array for no matches", async () => {
      const results =
        await certificationRepository.searchCertifications("NonExistent12345");

      expect(results).toHaveLength(0);
    });

    it("should handle special characters in search safely", async () => {
      const { userProfileId } = await seedUserWithProfile();

      await certificationRepository.linkCertification(userProfileId, {
        certificationName: "Cert with % special",
      });

      // Search for the literal % character — should not break
      const results = await certificationRepository.searchCertifications("%");

      expect(results.some((c) => c.certificationName.includes("%"))).toBe(true);
    });
  });

  describe("updateProfile - jobTitle/description persistence", () => {
    it("should persist jobTitle and description on work experience upsert", async () => {
      const { userId } = await seedUserWithProfile();

      // First updateProfile with work experience including jobTitle + description
      const result = await profileRepository.updateProfile(userId, {
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
      const result2 = await profileRepository.updateProfile(userId, {
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
