import {
  mysqlTable,
  timestamp,
  int,
  json,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { userProfile } from "@/db/schema/users";

export const jobPreferences = mysqlTable("job_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userProfileId: int("user_profile_id")
    .notNull()
    .unique()
    .references(() => userProfile.id, { onDelete: "cascade" }),
  jobTypes: json("job_types")
    .$type<
      ("full-time" | "part-time" | "contract" | "volunteer" | "internship")[]
    >()
    .notNull(), // Array of job types (e.g., ["full-time", "part-time"]),
  compensationTypes: json("compensation_types")
    .$type<("paid" | "missionary" | "volunteer" | "stipend")[]>()
    .notNull(), // Array of compensation types (e.g., "paid", "missionary", "volunteer", "stipend",),
  volunteerHoursPerWeek: mysqlEnum("volunteer_hours_per_week", [
    "less_than_10_hours",
    "10-20_hours",
    "20-30_hours",
    "30-40_hours",
    "over_40_hours",
  ]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const jobPreferenceRelations = relations(jobPreferences, ({ one }) => ({
  userProfile: one(userProfile, {
    fields: [jobPreferences.userProfileId],
    references: [userProfile.id],
  }),
}));
