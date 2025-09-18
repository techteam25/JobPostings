import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  text,
  boolean,
  decimal,
  int,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { organizations } from "./organizations";

// Jobs table
export const jobsDetails = mysqlTable(
  "job_details",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    jobType: mysqlEnum("job_type", [
      "full-time",
      "part-time",
      "contract",
      "volunteer",
      "internship",
    ]).notNull(),
    experienceLevel: mysqlEnum("experience_level", [
      "entry",
      "mid",
      "senior",
      "lead",
      "executive",
    ]).notNull(),
    salaryMin: decimal("salary_min", { precision: 10, scale: 2 }),
    salaryMax: decimal("salary_max", { precision: 10, scale: 2 }),
    isRemote: boolean("is_remote").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    applicationDeadline: timestamp("application_deadline"),
    requiredSkills: text("required_skills"), // JSON string of skills array
    employerId: int("employer_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("employer_idx").on(table.employerId),
    index("job_type_idx").on(table.jobType),
    index("location_idx").on(table.location),
    index("active_idx").on(table.isActive),
  ],
);

// Job applications table
export const jobApplications = mysqlTable(
  "job_applications",
  {
    id: int("id").primaryKey().autoincrement(),
    jobId: int("job_id").notNull(),
    applicantId: int("applicant_id").notNull(),
    status: mysqlEnum("status", [
      "pending",
      "reviewed",
      "shortlisted",
      "rejected",
      "hired",
    ])
      .default("pending")
      .notNull(),
    coverLetter: text("cover_letter"),
    resumeUrl: varchar("resume_url", { length: 500 }),
    appliedAt: timestamp("applied_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    notes: text("notes"),
  },
  (table) => [
    index("job_idx").on(table.jobId),
    index("applicant_idx").on(table.applicantId),
    index("status_idx").on(table.status),
  ],
);

// Relations
export const jobsRelations = relations(jobsDetails, ({ one, many }) => ({
  employer: one(users, {
    fields: [jobsDetails.employerId],
    references: [users.id],
  }),
  applications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(
  jobApplications,
  ({ one }) => ({
    job: one(jobsDetails, {
      fields: [jobApplications.jobId],
      references: [jobsDetails.id],
    }),
    applicant: one(users, {
      fields: [jobApplications.applicantId],
      references: [users.id],
    }),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  postedJobs: many(jobsDetails),
  applications: many(jobApplications),
}));

// Zod schemas for validation
export const insertJobSchema = createInsertSchema(jobsDetails, {
  title: z.string().min(5, "Title must be at least 5 characters").max(255),
  description: z.string().min(50, "Description must be at least 50 characters"),
  location: z.string().min(1, "Location is required").max(255),
  salaryMin: z.number().positive("Salary must be positive").optional(),
  salaryMax: z.number().positive("Salary must be positive").optional(),
  requiredSkills: z.string().optional(), // Will be JSON string
  employerId: z.number().positive("Employer ID is required"),
});

export const selectJobSchema = createSelectSchema(jobsDetails);
export const updateJobSchema = insertJobSchema
  .partial()
  .omit({ id: true, createdAt: true });

export const insertJobApplicationSchema = createInsertSchema(jobApplications, {
  jobId: z.number().positive("Job ID is required"),
  applicantId: z.number().positive("Applicant ID is required"),
  coverLetter: z
    .string()
    .max(2000, "Cover letter must not exceed 2000 characters")
    .optional(),
  resumeUrl: z.url("Invalid resume URL").optional(),
});

export const selectJobApplicationSchema = createSelectSchema(jobApplications);
export const updateJobApplicationSchema = insertJobApplicationSchema
  .partial()
  .omit({
    id: true,
    appliedAt: true,
    jobId: true,
    applicantId: true,
  });

// Public job schema (for job listings)
export const publicJobSchema = selectJobSchema
  .omit({
    employerId: true,
  })
  .extend({
    employer: z
      .object({
        id: z.number(),
        username: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        profilePicture: z.string().nullable(),
      })
      .optional(),
  });

// Type exports
export type Job = z.infer<typeof selectJobSchema>;
export type NewJob = z.infer<typeof insertJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type PublicJob = z.infer<typeof publicJobSchema>;

export type JobApplication = z.infer<typeof selectJobApplicationSchema>;
export type NewJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type UpdateJobApplication = z.infer<typeof updateJobApplicationSchema>;
