// noinspection JSUnusedGlobalSymbols

import { db } from "@/db/connection";
import { organizations, jobsDetails, users } from "@/db/schema";
import { sql } from "drizzle-orm";
import logger from "@/logger";

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

export const seedUsers = async () => {
  const { faker } = await import("@faker-js/faker");
  const bcrypt = await import("bcrypt");

  const hashedPassword = await bcrypt.hash("Password@123", 12);

  await db.insert(users).values(
    Array.from({ length: 5 }).map((_, index) => ({
      id: index + 1,
      email: faker.internet.email(),
      passwordHash: hashedPassword,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: "user" as const,
    })),
  );
};

export const seedOrganizations = async () => {
  const { faker } = await import("@faker-js/faker");
  await db.insert(organizations).values(
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
  );
};

export const seedJobs = async () => {
  const { faker } = await import("@faker-js/faker");

  try {
    await db.transaction(async (t) => {
      await t.delete(organizations);
      await t.delete(jobsDetails);

      // Reset auto-increment counters
      await t.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
      await t.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);

      const ids = await t
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

      const orgIds = ids.map((org) => org.id);

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
          employerId: faker.helpers.arrayElement(orgIds),
        })),
      );
    });
  } catch (error) {
    logger.error(`Error seeding jobs:, ${error}`);
  }
};
