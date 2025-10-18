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
  check,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { Organization, organizations } from "./organizations";

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
    compensationType: mysqlEnum("compensation_type", [
      "paid",
      "missionary",
      "volunteer",
      "stipend",
    ]).notNull(),
    salaryMin: decimal("salary_min", {
      precision: 12,
      scale: 2,
    }).$type<number>(),
    salaryMax: decimal("salary_max", {
      precision: 12,
      scale: 2,
    }).$type<number>(),
    isRemote: boolean("is_remote").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    applicationDeadline: timestamp("application_deadline"),
    skills: text("skills"), // JSON array of skills
    experience: text("experience"), // JSON array of skills
    employerId: int("employer_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("employer_idx").on(table.employerId),
    index("job_type_idx").on(table.jobType),
    index("location_idx").on(table.location),
    index("active_idx").on(table.isActive),
    index("deadline_idx").on(table.applicationDeadline),
    foreignKey({
      columns: [table.employerId],
      foreignColumns: [organizations.id],
      name: "fk_job_employer",
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
    appliedAt: timestamp("applied_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    notes: text("notes"),
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
  ],
);

// Job Statistics table
export const jobInsights = mysqlTable(
  "job_insights",
  {
    id: int("id").primaryKey().autoincrement(),
    job: int("job_id")
      .references(() => jobsDetails.id, { onDelete: "cascade" })
      .notNull(),
    organization: int("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    viewCount: int("view_count").default(0),
    applicationCount: int("application_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("job_idx").on(table.job),
    check(
      "application_count_must_be_gt_0",
      sql`(${table.applicationCount} >= 0)`,
    ), // avoid -ve value when performing application withdraw
  ],
);

// Relations
export const jobsRelations = relations(jobsDetails, ({ one, many }) => ({
  employer: one(organizations, {
    fields: [jobsDetails.employerId],
    references: [organizations.id],
  }),
  applications: many(jobApplications),
  jobViews: one(jobInsights, {
    fields: [jobsDetails.id],
    references: [jobInsights.job],
  }),
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

export const jobInsightsRelations = relations(jobInsights, ({ one }) => ({
  job: one(jobsDetails, {
    fields: [jobInsights.job],
    references: [jobsDetails.id],
  }),
  organization: one(organizations, {
    fields: [jobInsights.organization],
    references: [organizations.id],
  }),
}));

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
  employerId: z.number().int().positive("Employer ID is required"),
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
});

export const insertJobInsightsSchema = createInsertSchema(jobInsights, {
  viewCount: z.int().min(0, { error: "View Count cannot be less than 0" }),
  applicationCount: z
    .int()
    .min(0, { error: "Application Count cannot be less than 0" }),
});

export const selectJobSchema = createSelectSchema(jobsDetails);
export const selectJobInsightsSchema = createSelectSchema(jobInsights);
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
    updatedAt: true,
    reviewedAt: true,
    reviewedBy: true,
  });

export const updateJobInsightsSchema = insertJobInsightsSchema
  .partial()
  .omit({ id: true });

// Type exports
export type Job = z.infer<typeof selectJobSchema>;
export type JobInsight = z.infer<typeof selectJobInsightsSchema>;
export type NewJob = z.infer<typeof insertJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type JobApplication = z.infer<typeof selectJobApplicationSchema>;
export type NewJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type UpdateJobApplication = z.infer<typeof updateJobApplicationSchema>;
export type UpdateJobInsights = z.infer<typeof updateJobInsightsSchema>;
export type JobWithEmployer = {
  job: Job;
  employer: Pick<Organization, "id" | "name" | "city" | "state"> | null;
}[];
