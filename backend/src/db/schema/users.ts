import {
  mysqlTable,
  varchar,
  timestamp,
  text,
  boolean,
  int,
  json,
  check,
  index,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

import { account, session } from "./sessions";
import { educations } from "./educations";
import { workExperiences } from "./workExperiences";
import { userCertifications } from "./certifications";
import { organizationMembers } from "./organizations";
import { FileMetadata } from "@/validations/file.validation";

// Users table
export const user = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    fullName: text("full_name").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    deletedAt: timestamp("deleted_at", { fsp: 3 }),
    lastLoginAt: timestamp("last_login_at", { fsp: 3 }),
  },
  (table) => [
    index("idx_users_status").on(table.status),
    index("idx_users_email").on(table.email),

    check(
      "status_must_be_valid",
      sql`(${table.status} IN ("active", "deactivated", "deleted"))`,
    ),
    check(
      "deleted_status_requires_deleted_at",
      sql`(${table.status} != 'deleted' OR ${table.deletedAt} IS NOT NULL)`,
    ),
  ],
);

export const userProfile = mysqlTable("user_profile", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  profilePicture: varchar("profile_picture", { length: 500 }),
  bio: text("bio"),
  resumeUrl: varchar("resume_url", { length: 255 }),
  linkedinUrl: varchar("linkedin_url", { length: 255 }),
  portfolioUrl: varchar("portfolio_url", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 10 }),
  country: varchar("country", { length: 100 }).default("US"),
  isProfilePublic: boolean("is_profile_public").default(true).notNull(),
  isAvailableForWork: boolean("is_available_for_work").default(true).notNull(),
  fileMetadata: json("file_metadata").$type<FileMetadata[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export const userOnBoarding = mysqlTable("user_onboarding", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  intent: mysqlEnum(["seeker", "employer"]).default("seeker").notNull(), // User intent: job seeker or employer
  status: mysqlEnum(["completed", "pending"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Relations
export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(userProfile, {
    fields: [user.id],
    references: [userProfile.userId],
  }),
  sessions: many(session),
  organizationMembers: many(organizationMembers),
  account: one(account, {
    fields: [user.id],
    references: [account.userId],
  }),
  onboarding: one(userOnBoarding, {
    fields: [user.id],
    references: [userOnBoarding.userId],
  }),
}));

export const userProfileRelations = relations(userProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
  education: many(educations),
  workExperiences: many(workExperiences),
  certifications: many(userCertifications),
}));

export const userOnBoardingRelations = relations(userOnBoarding, ({ one }) => ({
  user: one(user, {
    fields: [userOnBoarding.userId],
    references: [user.id],
  }),
}));
