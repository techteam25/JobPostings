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
  foreignKey,
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
      "short-term-trip",
    ]).notNull(),
    compensationType: mysqlEnum("compensation_type", [
      "paid",
      "missionary",
      "volunteer",
      "stipend",
    ]).notNull(),
    experienceLevel: mysqlEnum("experience_level", [
      "entry",
      "mid",
      "senior",
      "lead",
      "executive",
    ]).notNull(),
    salaryMin: decimal("salary_min", {
      precision: 12,
      scale: 2,
    }).$type<number>(),
    salaryMax: decimal("salary_max", {
      precision: 12,
      scale: 2,
    }).$type<number>(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    isRemote: boolean("is_remote").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    applicationDeadline: timestamp("application_deadline"),
    requiredSkills: text("required_skills"), // JSON array of skills
    preferredSkills: text("preferred_skills"), // JSON array of skills
    benefits: text("benefits"),
    employerId: int("employer_id").notNull(),
    postedById: int("posted_by_id").notNull(),
    viewCount: int("view_count").default(0).notNull(),
    applicationCount: int("application_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("employer_idx").on(table.employerId),
    index("posted_by_idx").on(table.postedById),
    index("job_type_idx").on(table.jobType),
    index("location_idx").on(table.location),
    index("active_idx").on(table.isActive),
    index("deadline_idx").on(table.applicationDeadline),
    foreignKey({
      columns: [table.employerId],
      foreignColumns: [organizations.id],
      name: "fk_job_employer",
    }),
    foreignKey({
      columns: [table.postedById],
      foreignColumns: [users.id],
      name: "fk_job_poster",
    }),
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
      "interviewing",
      "rejected",
      "hired",
      "withdrawn",
    ])
      .default("pending")
      .notNull(),
    coverLetter: text("cover_letter"),
    resumeUrl: varchar("resume_url", { length: 500 }),
    customAnswers: text("custom_answers"), // JSON for custom application questions
    appliedAt: timestamp("applied_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: int("reviewed_by"),
    notes: text("notes"),
    rating: int("rating"), // 1-5 rating by employer
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("job_idx").on(table.jobId),
    index("applicant_idx").on(table.applicantId),
    index("status_idx").on(table.status),
    index("applied_date_idx").on(table.appliedAt),
    foreignKey({
      columns: [table.jobId],
      foreignColumns: [jobsDetails.id],
      name: "fk_application_job",
    }),
    foreignKey({
      columns: [table.applicantId],
      foreignColumns: [users.id],
      name: "fk_application_applicant",
    }),
    foreignKey({
      columns: [table.reviewedBy],
      foreignColumns: [users.id],
      name: "fk_application_reviewer",
    }),
  ],
);

// Relations
export const jobsRelations = relations(jobsDetails, ({ one, many }) => ({
  employer: one(organizations, {
    fields: [jobsDetails.employerId],
    references: [organizations.id],
  }),
  postedBy: one(users, {
    fields: [jobsDetails.postedById],
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
    reviewer: one(users, {
      fields: [jobApplications.reviewedBy],
      references: [users.id],
    }),
  }),
);

// Validation schemas
export const insertJobSchema = createInsertSchema(jobsDetails, {
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(255)
    .trim(),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000),
  location: z.string().min(1, "Location is required").max(255).trim(),
  salaryMin: z.number().positive("Salary must be positive").optional(),
  salaryMax: z.number().positive("Salary must be positive").optional(),
  requiredSkills: z.string().optional(),
  preferredSkills: z.string().optional(),
  benefits: z.string().max(2000).optional(),
  employerId: z.number().int().positive("Employer ID is required"),
  postedById: z.number().int().positive("Posted by ID is required"),
}).refine(
  (data) =>
    !data.salaryMax || !data.salaryMin || data.salaryMax >= data.salaryMin,
  {
    message: "Maximum salary must be greater than or equal to minimum salary",
    path: ["salaryMax"],
  },
);

export const insertJobApplicationSchema = createInsertSchema(jobApplications, {
  jobId: z.number().int().positive("Job ID is required"),
  applicantId: z.number().int().positive("Applicant ID is required"),
  coverLetter: z
    .string()
    .min(50, "Cover letter must be at least 50 characters")
    .max(2000)
    .optional(),
  resumeUrl: z.url("Invalid resume URL").optional(),
  customAnswers: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const selectJobSchema = createSelectSchema(jobsDetails);
export const selectJobApplicationSchema = createSelectSchema(jobApplications);

export const updateJobSchema = insertJobSchema.partial().omit({
  id: true,
  createdAt: true,
  employerId: true,
  postedById: true,
});

export const updateJobApplicationSchema = insertJobApplicationSchema
  .partial()
  .omit({
    id: true,
    jobId: true,
    applicantId: true,
    appliedAt: true,
    createdAt: true,
  });

// Type exports
export type Job = z.infer<typeof selectJobSchema>;
export type NewJob = z.infer<typeof insertJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type JobApplication = z.infer<typeof selectJobApplicationSchema>;
export type NewJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type UpdateJobApplication = z.infer<typeof updateJobApplicationSchema>;
