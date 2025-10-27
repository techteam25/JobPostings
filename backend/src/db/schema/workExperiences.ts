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
export const workExperiencesRelations = relations(
  workExperiences,
  ({ one }) => ({
    experience: one(userProfile, {
      fields: [workExperiences.userProfileId],
      references: [userProfile.id],
    }),
  }),
);
