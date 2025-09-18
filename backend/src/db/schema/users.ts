import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  text,
  boolean,
  int,
  check,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";
import { organizations } from "./organizations";
import { educations } from "./educations";
import { auth } from "./auth";

// Users table
export const users = mysqlTable(
  "users",
  {
    id: int("id").primaryKey().autoincrement(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["user", "employer", "admin"])
      .default("user")
      .notNull(),
    organizationId: int("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    check(
      "employer_must_have_organization",
      sql`(${table.role} != 'employer' OR ${table.organizationId} IS NOT NULL)`,
    ),
  ],
);

export const userProfile = mysqlTable("user_profile", {
  id: int("id").primaryKey().autoincrement(),
  profilePicture: varchar("profile_picture", { length: 500 }),
  bio: text("bio"),
  userId: int("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  resumeUrl: varchar("resume_url", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfile),
  employer: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  authentication: many(auth),
}));

export const userProfileRelations = relations(userProfile, ({ one, many }) => ({
  profile: one(users, {
    fields: [userProfile.userId],
    references: [users.id],
  }),
  education: many(educations),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.email("Invalid email format"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  passwordHash: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertUserProfileSchema = createInsertSchema(userProfile, {
  profilePicture: z.email("Invalid email format"),
  bio: z
    .string()
    .min(10, "User Bio cannot be less than 30 characters")
    .max(500)
    .optional(),
  resumeUrl: z.url("Invalid resume URL").optional(),
});

export const selectUserSchema = createSelectSchema(users);
export const updateUserSchema = insertUserSchema
  .partial()
  .omit({ id: true, createdAt: true });

export const selectUserProfileSchema = createSelectSchema(userProfile);
export const updateUserProfileSchema = insertUserProfileSchema
  .partial()
  .omit({ id: true, createdAt: true });

// Public user schema (without sensitive data)
export const publicUserSchema = selectUserSchema.omit({
  passwordHash: true,
  isEmailVerified: true,
});

// Type exports
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type UserProfile = z.infer<typeof selectUserProfileSchema>;
export type NewUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
