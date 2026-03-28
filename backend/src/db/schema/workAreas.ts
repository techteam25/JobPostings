import {
  mysqlTable,
  timestamp,
  int,
  varchar,
  unique,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { jobPreferences } from "@/db/schema/jobPreferences";

export const workAreas = mysqlTable("work_areas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobPreferenceWorkAreas = mysqlTable(
  "job_preference_work_areas",
  {
    id: int("id").autoincrement().primaryKey(),
    jobPreferenceId: int("job_preference_id")
      .notNull()
      .references(() => jobPreferences.id, { onDelete: "cascade" }),
    workAreaId: int("work_area_id")
      .notNull()
      .references(() => workAreas.id, { onDelete: "cascade" }),
  },
  (t) => [
    unique("unq_preference_work_area").on(t.jobPreferenceId, t.workAreaId),
  ],
);

export const workAreaRelations = relations(workAreas, ({ many }) => ({
  jobPreferenceWorkAreas: many(jobPreferenceWorkAreas),
}));

export const jobPreferenceWorkAreaRelations = relations(
  jobPreferenceWorkAreas,
  ({ one }) => ({
    jobPreference: one(jobPreferences, {
      fields: [jobPreferenceWorkAreas.jobPreferenceId],
      references: [jobPreferences.id],
    }),
    workArea: one(workAreas, {
      fields: [jobPreferenceWorkAreas.workAreaId],
      references: [workAreas.id],
    }),
  }),
);
