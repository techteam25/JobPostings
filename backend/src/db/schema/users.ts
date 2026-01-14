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
import { jobAlerts } from "@/db/schema/jobAlerts";

/**
 * Users table schema defining the structure for storing user account information.
 */
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

/**
 * User profile table schema defining the structure for storing detailed user profile information.
 */
export const userProfile = mysqlTable(
  "user_profile",
  {
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
    isAvailableForWork: boolean("is_available_for_work")
      .default(true)
      .notNull(),
    fileMetadata: json("file_metadata").$type<FileMetadata[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_user_profile_is_profile_public").on(table.isProfilePublic),
  ],
);

/**
 * User onboarding table schema defining the structure for storing user onboarding information.
 */
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

export const userEmailPreferences = mysqlTable(
  "user_email_preferences",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    // Notification Type Preferences (all default true)
    jobMatchNotifications: boolean("job_alerts").default(true).notNull(),
    applicationStatusNotifications: boolean("application_status")
      .default(true)
      .notNull(),
    savedJobUpdates: boolean("saved_job_updates").default(true).notNull(),
    weeklyJobDigest: boolean("weekly_job_digest").default(true).notNull(),
    monthlyNewsletter: boolean("monthly_newsletter").default(true).notNull(),
    marketingEmails: boolean("marketing_emails").default(true).notNull(),
    accountSecurityAlerts: boolean("account_security_alerts")
      .default(true)
      .notNull(),

    // Unsubscribe Token Management
    unsubscribeToken: varchar("unsubscribe_token", { length: 255 }).notNull(),
    tokenCreatedAt: timestamp("token_created_at").defaultNow().notNull(),
    unsubscribeTokenExpiresAt: timestamp("unsubscribe_token_expires_at"),
    globalUnsubscribe: boolean("global_unsubscribe").default(false).notNull(),

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_user_email_preferences_user_id").on(table.userId),
    index("idx_user_email_preferences_unsubscribe_token").on(
      table.unsubscribeToken,
    ),
  ],
);

// Relations
/**
 * Relations for the user table, defining relationships with profile, sessions, organization members, account, and onboarding.
 */
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
  emailPreference: one(userEmailPreferences, {
    fields: [user.id],
    references: [userEmailPreferences.userId],
  }),
  jobAlerts: many(jobAlerts),
}));

/**
 * Relations for the userProfile table, defining relationships with user, education, work experiences, and certifications.
 */
export const userProfileRelations = relations(userProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
  education: many(educations),
  workExperiences: many(workExperiences),
  certifications: many(userCertifications),
}));

/**
 * Relations for the userOnBoarding table, defining one-to-one relationship with user.
 */
export const userOnBoardingRelations = relations(userOnBoarding, ({ one }) => ({
  user: one(user, {
    fields: [userOnBoarding.userId],
    references: [user.id],
  }),
}));

/**
 * Relations for the userEmailPreferences table, defining one-to-one relationship with user.
 */
export const userEmailPreferencesRelations = relations(
  userEmailPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [userEmailPreferences.userId],
      references: [user.id],
    }),
  }),
);
