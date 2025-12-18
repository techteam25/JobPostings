import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  index,
  check,
  int,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { userProfile } from "./users";

/**
 * Work experiences table schema defining the structure for storing user work experience information.
 */
export const workExperiences = mysqlTable(
  "work_experiences",
  {
    id: int("id").primaryKey().autoincrement(),
    userProfileId: int("user_profile_id")
      .references(() => userProfile.id, {
        onDelete: "cascade",
      })
      .notNull(),
    companyName: varchar("company_name", { length: 100 }).notNull(),
    current: boolean("current").default(false).notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
  },
  (table) => [
    index("program_idx").on(table.companyName),
    check(
      "resigned_end_date_check",
      sql`(${table.current} = false OR ${table.endDate} IS NOT NULL)`,
    ),
  ],
);

// Relations
/**
 * Relations for the workExperiences table, defining one-to-one relationship with userProfile.
 */
export const workExperiencesRelations = relations(
  workExperiences,
  ({ one }) => ({
    experience: one(userProfile, {
      fields: [workExperiences.userProfileId],
      references: [userProfile.id],
    }),
  }),
);
