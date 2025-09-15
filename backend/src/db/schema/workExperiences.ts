import {
  mysqlTable,
  serial,
  varchar,
  timestamp,
  boolean,
  index,
  check,
  int,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";
import { userProfile } from "./users";

export const workExperiences = mysqlTable(
  "work_experiences",
  {
    id: serial("id").primaryKey(),
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
      "graduated_end_date_check",
      sql`${table.current} = false OR ${table.endDate} IS NOT NULL`,
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

// Zod schemas for validation
export const selectWorkExperiencesSchema = createSelectSchema(workExperiences);
export const insertWorkExperiencesSchema = createInsertSchema(workExperiences, {
  companyName: z.string().min(1, "Company name is required").max(100),
  current: z.boolean().default(false),
});
export const updateWorkExperiencesSchema = insertWorkExperiencesSchema
  .partial()
  .omit({ id: true, userProfileId: true });

// Type exports
export type WorkExperience = z.infer<typeof selectWorkExperiencesSchema>;
export type UpdateWorkExperience = z.infer<typeof updateWorkExperiencesSchema>;
export type InsertWorkExperience = z.infer<typeof insertWorkExperiencesSchema>;
