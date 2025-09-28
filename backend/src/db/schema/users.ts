import { organizations } from './organizations';
import { sessions } from './sessions';
import { auth } from './auth';
import { educations } from './educations';
import { workExperiences } from './workExperiences';
import { userCertifications } from './certifications';
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
    organizationId: int("organization_id"),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at"),
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
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfile, {
    fields: [users.id],
    references: [userProfile.userId],
  }),
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  sessions: many(sessions),
  authProviders: many(auth),
}));

export const userProfileRelations = relations(userProfile, ({ one, many }) => ({
  user: one(users, {
    fields: [userProfile.userId],
    references: [users.id],
  }),
  education: many(educations),
  workExperiences: many(workExperiences),
  certifications: many(userCertifications),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format").toLowerCase(),
  firstName: z.string().min(1, "First name is required").max(100).trim(),
  lastName: z.string().min(1, "Last name is required").max(100).trim(),
  passwordHash: z.string().min(60, "Invalid password hash"),
  role: z.enum(['user', 'employer', 'admin']).default('user'),
  organizationId: z.number().int().positive().nullable().optional(),
});

export const insertUserProfileSchema = createInsertSchema(userProfile, {
  userId: z.number().int().positive(),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(1000).optional(),
  resumeUrl: z.string().url("Invalid resume URL").optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional(),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional(),
});

export const selectUserSchema = createSelectSchema(users);
export const selectUserProfileSchema = createSelectSchema(userProfile);

export const updateUserSchema = insertUserSchema
  .partial()
  .omit({ id: true, createdAt: true, passwordHash: true });

export const updateUserProfileSchema = insertUserProfileSchema
  .partial()
  .omit({ id: true, userId: true, createdAt: true });

// Safe user schema (without sensitive data)
export const safeUserSchema = selectUserSchema.omit({
  passwordHash: true,
});

// Type exports
export type User = z.infer<typeof selectUserSchema>;
export type SafeUser = z.infer<typeof safeUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserProfile = z.infer<typeof selectUserProfileSchema>;
export type NewUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;