import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  text,
  boolean,
  int,
  index,
  json,
  float,
  check,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { user } from "./users";
import { jobsDetails } from "@/db/schema/jobsDetails";

type JobTypes = "full_time | part_time | contract | temporary | intern";

export const jobAlerts = mysqlTable(
  "job_alerts",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    state: varchar("state", { length: 255 }),
    city: varchar("city", { length: 255 }),
    searchQuery: text("search_query"),
    jobType: json("job_type").$type<JobTypes[]>(),
    skills: json("skills").$type<string[]>(),
    experienceLevel: json("experience_level").$type<string[]>(),
    isActive: boolean("is_active").notNull().default(true),
    isPaused: boolean("is_paused").notNull().default(false),
    includeRemote: boolean("include_remote").notNull().default(true),
    frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"])
      .notNull()
      .default("weekly"),
    lastSentAt: timestamp("last_sent_at").defaultNow().onUpdateNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => [
    index("job_alerts_user_id_idx").on(table.userId),
    index("job_alerts_is_active_idx").on(table.isActive),
    index("job_alerts_is_paused_idx").on(table.isPaused),
    index("job_alerts_frequency_idx").on(table.frequency),
    index("job_alerts_user_id_is_active_idx").on(table.userId, table.isActive),
    check(
      "job_alerts_check_search_query_or_filters",
      sql`(
            ${sql.raw("JSON_LENGTH")}(${table.jobType}) > 0 OR
            ${sql.raw("JSON_LENGTH")}(${table.skills}) > 0 OR
            ${sql.raw("JSON_LENGTH")}(${table.experienceLevel}) > 0 OR
            ${table.city} IS NOT NULL OR
            ${table.state} IS NOT NULL OR
            (${table.searchQuery} IS NOT NULL AND CHAR_LENGTH(TRIM(${table.searchQuery})) > 0)
          )`,
    ),
  ],
);

export const jobAlertMatches = mysqlTable(
  "job_alert_matches",
  {
    id: int("id").primaryKey().autoincrement(),
    jobAlertId: int("job_alert_id")
      .references(() => jobAlerts.id, { onDelete: "cascade" })
      .notNull(),
    jobId: int("job_id")
      .references(() => jobsDetails.id, { onDelete: "cascade" })
      .notNull(),
    matchScore: float("match_score").notNull(), // ML based match score
    wasSent: boolean("was_sent").notNull().default(false),
    matchedAt: timestamp("matched_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("job_alert_matches_job_alert_id_idx").on(table.jobAlertId),
    index("job_alert_matches_job_id_idx").on(table.jobId),
    index("job_alert_matches_was_sent_idx").on(table.wasSent),
    index("job_alert_matches_job_alert_id_was_sent_idx").on(
      table.jobAlertId,
      table.wasSent,
    ),
  ],
);

export const jobAlertRelations = relations(jobAlerts, ({ one }) => ({
  user: one(user, {
    fields: [jobAlerts.userId],
    references: [user.id],
  }),
}));

export const jobAlertMatchRelations = relations(jobAlertMatches, ({ one }) => ({
  jobAlert: one(jobAlerts, {
    fields: [jobAlertMatches.jobAlertId],
    references: [jobAlerts.id],
  }),
  job: one(jobsDetails, {
    fields: [jobAlertMatches.jobId],
    references: [jobsDetails.id],
  }),
}));
