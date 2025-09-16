import {
  mysqlTable,
  serial,
  varchar,
  timestamp,
  mysqlEnum,
  boolean,
  index,
  check,
  int,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";
import { userProfile } from "./users";
import { selectAuthSchema } from "./auth";

export const educations = mysqlTable(
  "educations",
  {
    id: serial("id").primaryKey(),
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
      sql`${table.graduated} = false OR ${table.endDate} IS NOT NULL`,
    ),
  ],
);

// Relations
export const educationsRelations = relations(educations, ({ one }) => ({
  education: one(userProfile, {
    fields: [educations.userProfileId],
    references: [userProfile.id],
  }),
}));

// Zod schemas for validation
export const selectEducationsSchema = createSelectSchema(educations);
export const insertEducationsSchema = createInsertSchema(educations, {
  schoolName: z.string().min(1, "School name is required").max(100),
  major: z.string().min(1, "Program major is required").max(100),
  graduated: z.boolean().default(false),
});
export const updateEducationsSchema = insertEducationsSchema
  .partial()
  .omit({ id: true, userProfileId: true });

// Type exports
export type Education = z.infer<typeof selectEducationsSchema>;
export type UpdateEducation = z.infer<typeof updateEducationsSchema>;
export type InsertEducation = z.infer<typeof insertEducationsSchema>;
