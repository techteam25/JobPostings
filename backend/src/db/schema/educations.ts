import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  boolean,
  index,
  check,
  int,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { userProfile } from "./users";

/**
 * Educations table schema defining the structure for storing user education information.
 */
export const educations = mysqlTable(
  "educations",
  {
    id: int("id").primaryKey().autoincrement(),
    userProfileId: int("user_profile_id")
      .references(() => userProfile.id, {
        onDelete: "cascade",
      })
      .notNull(),
    schoolName: varchar("school_name", { length: 100 }).notNull(),
    program: mysqlEnum("program", [
      "GED",
      "High School Diploma",
      "Associate Degree",
      "Bachelors",
      "Masters",
      "Doctorate",
    ]).notNull(),
    major: varchar("major", { length: 100 }).notNull(),
    graduated: boolean("graduated").default(false).notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
  },
  (table) => [
    index("program_idx").on(table.program),
    index("major_idx").on(table.major),
    check(
      "graduated_end_date_check",
      sql<boolean>`(${table.graduated} = false OR ${table.endDate} IS NOT NULL)`,
    ),
  ],
);

// Relations
/**
 * Relations for the educations table, defining one-to-one relationship with userProfile.
 */
export const educationsRelations = relations(educations, ({ one }) => ({
  education: one(userProfile, {
    fields: [educations.userProfileId],
    references: [userProfile.id],
  }),
}));
