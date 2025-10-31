import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  text,
  boolean,
  int,
  index,
  check,
  foreignKey,
  unique,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { user } from "./users";
import { organizations } from "./organizations";

// Jobs table
export const jobsDetails = mysqlTable(
  "job_details",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    city: varchar("city", { length: 255 }).notNull(),
    state: varchar("state", { length: 50 }),
    country: varchar("country", { length: 100 }).notNull(),
    zipcode: int("zipcode"),
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
    isRemote: boolean("is_remote").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    applicationDeadline: timestamp("application_deadline"),
    experience: varchar("experience", { length: 255 }),
    employerId: int("employer_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("employer_idx").on(table.employerId),
    index("job_type_idx").on(table.jobType),
    index("city_idx").on(table.city),
    index("state_idx").on(table.state),
    index("zipcode_idx").on(table.zipcode),
    index("is_remote_idx").on(table.isRemote),
    index("experience_idx").on(table.experience),
    index("is_active_idx").on(table.isActive),
    index("active_idx").on(table.isActive),
    index("deadline_idx").on(table.applicationDeadline),
    index("created_at_idx").on(table.createdAt),
    foreignKey({
      columns: [table.employerId],
      foreignColumns: [organizations.id],
      name: "fk_job_employer",
    }).onDelete("cascade"),
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
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.applicantId],
      foreignColumns: [user.id],
      name: "fk_application_applicant",
    }).onDelete("cascade"),
  ],
);

export const applicationNotes = mysqlTable(
  "application_notes",
  {
    id: int("id").primaryKey().autoincrement(),
    applicationId: int("application_id").notNull(),
    userId: int("user_id").notNull(),
    note: text("note").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("application_idx").on(table.applicationId),
    index("user_idx").on(table.userId),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [jobApplications.id],
      name: "fk_note_application",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "fk_note_user",
    }).onDelete("cascade"),
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

export const skills = mysqlTable(
  "skills",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("skill_name_idx").on(table.name)],
);

export const jobSkills = mysqlTable(
  "job_skills",
  {
    id: int("id").primaryKey().autoincrement(),
    jobId: int("job_id")
      .references(() => jobsDetails.id, { onDelete: "cascade" })
      .notNull(),
    skillId: int("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    isRequired: boolean().default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("job_idx").on(table.jobId),
    index("skill_idx").on(table.skillId),
  ],
);

export const savedJobs = mysqlTable(
  "saved_jobs",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    jobId: int("job_id")
      .references(() => jobsDetails.id, { onDelete: "cascade" })
      .notNull(),
    savedAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_idx").on(table.userId),
    index("job_idx").on(table.jobId),
    unique("unique_user_job").on(table.userId, table.jobId),
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
  skills: many(jobSkills),
}));

export const jobApplicationsRelations = relations(
  jobApplications,
  ({ one, many }) => ({
    job: one(jobsDetails, {
      fields: [jobApplications.jobId],
      references: [jobsDetails.id],
    }),
    applicant: one(user, {
      fields: [jobApplications.applicantId],
      references: [user.id],
    }),
    notes: many(applicationNotes),
  }),
);

export const applicationNotesRelations = relations(
  applicationNotes,
  ({ one }) => ({
    application: one(jobApplications, {
      fields: [applicationNotes.applicationId],
      references: [jobApplications.id],
    }),
    user: one(user, {
      fields: [applicationNotes.userId],
      references: [user.id],
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

export const jobSkillsRelations = relations(jobSkills, ({ one }) => ({
  job: one(jobsDetails, {
    fields: [jobSkills.jobId],
    references: [jobsDetails.id],
  }),
  skill: one(skills, {
    fields: [jobSkills.skillId],
    references: [skills.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  jobSkills: many(jobSkills),
}));
