// noinspection JSUnusedGlobalSymbols

import { eq, sql } from "drizzle-orm";

import logger from "@/logger";

import { auth } from "@/utils/auth";
import { db } from "@/db/connection";
import {
  organizations,
  jobsDetails,
  user,
  userProfile,
  organizationMembers,
} from "@/db/schema";
import { userProfileFixture } from "@tests/utils/fixtures";

enum jobTypeEnum {
  FULL_TIME = "full-time",
  PART_TIME = "part-time",
  CONTRACT = "contract",
  VOLUNTEER = "volunteer",
  INTERNSHIP = "internship",
}

enum compensationTypeEnum {
  PAID = "paid",
  MISSIONARY = "missionary",
  VOLUNTEER = "volunteer",
  STIPEND = "stipend",
}

export const seedUser = async (
  status: "active" | "deactivated" | "deleted" = "active",
) => {
  const { faker } = await import("@faker-js/faker");

  await db.transaction(async (trx) => {
    await trx.delete(user);

    // Reset auto-increment counters
    await trx.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

    const createdUser = await auth.api.signUpEmail({
      body: {
        email: "normal.user@example.com",
        password: "Password@123",
        name: faker.person.firstName() + " " + faker.person.lastName(),
        image: faker.image.avatar(),
      },
    });

    await trx
      .update(user)
      .set({ status })
      .where(eq(user.id, Number(createdUser.user.id)));
  });
};

export const seedUsers = async () => {
  const { faker } = await import("@faker-js/faker");
  const bcrypt = await import("bcrypt");

  const hashedPassword = await bcrypt.hash("Password@123", 12);

  await db.transaction(async (trx) => {
    await trx.delete(user);

    // Reset auto-increment counters
    await trx.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

    await trx.insert(user).values(
      Array.from({ length: 5 }).map((_, index) => ({
        id: index + 1,
        email: faker.internet.email(),
        passwordHash: hashedPassword,
        fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
        emailVerified: true,
        image: faker.image.avatar(),
        role: "user" as const,
      })),
    );
  });
};

export const seedOrganizations = async () => {
  const { faker } = await import("@faker-js/faker");

  await db.transaction(async (trx) => {
    await trx.delete(organizationMembers);
    await trx.delete(organizations);
    await trx.delete(user);

    // Reset auto-increment counters
    await trx.execute(sql`ALTER TABLE organization_members AUTO_INCREMENT = 1`);
    await trx.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
    await trx.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

    const owner = await auth.api.signUpEmail({
      body: {
        email: "org.owner@example.com",
        password: "Password@123",
        name: faker.person.firstName() + " " + faker.person.lastName(),
        image: faker.image.avatar(),
      },
    });

    if (!owner) {
      throw new Error("Failed to create organization owner");
    }

    const createdOrgIds = await trx
      .insert(organizations)
      .values(
        Array.from({ length: 3 }).map(() => ({
          name: faker.company.name(),
          streetAddress: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode("#####"),
          phone: faker.phone.number({ style: "international" }),
          url: faker.internet.url(),
          mission: faker.lorem.sentence(),
        })),
      )
      .$returningId();

    if (createdOrgIds && createdOrgIds.length === 0) {
      throw new Error("No organizations were created");
    }

    const orgMemberInserts = await trx
      .insert(organizationMembers)
      .values(
        createdOrgIds.map((orgId) => ({
          userId: Number(owner.user.id),
          organizationId: orgId.id,
          role: "owner" as const,
          isActive: true,
        })),
      )
      .$returningId();
  });
};

export const seedJobs = async () => {
  const { faker } = await import("@faker-js/faker");

  try {
    await db.transaction(async (t) => {
      await t.delete(user);
      await t.delete(organizations);
      await t.delete(jobsDetails);

      // Reset auto-increment counters
      await t.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
      await t.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);

      await t
        .insert(organizations)
        .values(
          Array.from({ length: 5 }).map(() => ({
            name: faker.company.name(),
            streetAddress: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode("#####"),
            phone: faker.phone.number({ style: "international" }),
            contact: 1,
            url: faker.internet.url(),
            mission: faker.lorem.sentence(),
          })),
        )
        .$returningId();

      await t.insert(jobsDetails).values(
        Array.from({ length: 3 }).map(() => ({
          title: faker.lorem.words(5),
          description: faker.lorem.paragraph(1),
          location: faker.location.city(),
          jobType: faker.helpers.enumValue(jobTypeEnum),
          compensationType: faker.helpers.enumValue(compensationTypeEnum),
          salaryMin: faker.number.int({ min: 30000, max: 100000 }),
          salaryMax: faker.number.int({ min: 100001, max: 200000 }),
          isRemote: faker.datatype.boolean(),
          isActive: true,
          applicationDeadline: faker.date.future(),
          skills: JSON.stringify(
            faker.helpers.arrayElements([
              "JavaScript",
              "TypeScript",
              "Node.js",
              "React",
              "SQL",
              "NoSQL",
              "AWS",
            ]),
          ),
          employerId: 1, // faker.helpers.arrayElement(orgIds),
        })),
      );
    });
  } catch (error) {
    logger.error(`Error seeding jobs:, ${JSON.stringify(error, null, 2)}`);
  }
};

export const seedAdminUser = async () => {
  const { faker } = await import("@faker-js/faker");

  try {
    await db.transaction(async (t) => {
      await t.delete(user);

      // Reset auto-increment counters
      await t.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

      await auth.api.signUpEmail({
        body: {
          email: "normal.user@example.com",
          password: "Password@123",
          name: faker.person.firstName() + " " + faker.person.lastName(),
          image: faker.image.avatar(),
        },
      });
    });
  } catch (error) {
    console.error(error);
  }
};

export const seedUserProfile = async () => {
  const { faker } = await import("@faker-js/faker");

  const userProfileData = await userProfileFixture();

  try {
    await db.transaction(async (trx) => {
      await trx.delete(user);

      await trx.execute(sql`ALTER TABLE user_profile AUTO_INCREMENT = 1`);
      await trx.execute(sql`ALTER TABLE educations AUTO_INCREMENT = 1`);
      await trx.execute(sql`ALTER TABLE work_experiences AUTO_INCREMENT = 1`);
      await trx.execute(sql`ALTER TABLE certifications AUTO_INCREMENT = 1`);
      await trx.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

      const createdUser = await auth.api.signUpEmail({
        body: {
          email: "normal.user@example.com",
          password: "Password@123",
          name: faker.person.firstName() + " " + faker.person.lastName(),
          image: faker.image.avatar(),
        },
      });

      if (!createdUser || !parseInt(createdUser.user.id)) {
        throw new Error(`Invalid insertId returned: ${createdUser.user.id}`);
      }

      await trx.insert(userProfile).values({
        ...userProfileData,
        userId: Number(createdUser.user.id),
      });
    });
  } catch (error) {
    console.error("Error seeding user profile: ", error);
  }
};
