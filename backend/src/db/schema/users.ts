import { session } from "./sessions";
import { Education, educations, insertEducationsSchema } from "./educations";
import {
  insertWorkExperiencesSchema,
  WorkExperience,
  workExperiences,
} from "./workExperiences";
import {
  Certification,
  insertCertificationsSchema,
  userCertifications,
} from "./certifications";
import {
  mysqlTable,
  varchar,
  timestamp,
  text,
  boolean,
  int,
  check,
  index,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

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
    status: text("status").default("active").notNull(),
    deletedAt: timestamp("deleted_at", { fsp: 3 }),
    lastLoginAt: timestamp("last_login_at", { fsp: 3 }),
  },
  (table) => [
    index("idx_users_status").on(table.status),
    index("idx_users_email").on(table.email),

    check(
      "status_must_be_valid",
      sql`${table.status} IN ("active", "deactivated", "deleted")`,
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

// Zod schemas
export const insertUserSchema = createInsertSchema(user, {
  email: z.email("Invalid email format").toLowerCase(),
  fullName: z.string().min(1, "First name is required").max(100).trim(),
  status: z.enum(["active", "deactivated", "deleted"]).default("active"),
  deletedAt: z.date().optional(),
});

export const insertUserProfileSchema = createInsertSchema(userProfile, {
  userId: z.number().int().positive(),
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(1000)
    .optional(),
  resumeUrl: z.url("Invalid resume URL").optional(),
  linkedinUrl: z.url("Invalid LinkedIn URL").optional(),
  portfolioUrl: z.url("Invalid portfolio URL").optional(),
});

export const selectUserSchema = createSelectSchema(user);
export const selectUserProfileSchema = createSelectSchema(userProfile);

export const updateUserSchema = insertUserSchema.partial().omit({
  id: true,
  createdAt: true,
  passwordHash: true,
  updatedAt: true,
  deletedAt: true,
});

export const updateUserProfileSchema = insertUserProfileSchema
  .omit({ userId: true })
  .extend({
    educations: insertEducationsSchema
      .omit({ userProfileId: true })
      .array()
      .default([]),
    workExperiences: insertWorkExperiencesSchema
      .omit({ userProfileId: true })
      .array()
      .default([]),
    // certifications: z.array(insertCertificationsSchema).default([]),
  });

// Type exports
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserProfile = z.infer<typeof selectUserProfileSchema>;
export type NewUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// Get type with relations
export type UserWithProfile = User & {
  profile:
    | (UserProfile & {
        certifications: { certification: Certification }[] | null;
        education: Education[] | null;
        workExperiences: WorkExperience[] | null;
      })
    | null;
};
