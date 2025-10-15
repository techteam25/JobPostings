import { mysqlTable, varchar, int, primaryKey } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

import { userProfile } from "./users";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

export const certifications = mysqlTable("certifications", {
  id: int("id").primaryKey().autoincrement(),
  certificationName: varchar("certification_name", { length: 100 }).notNull(),
});

export const userCertifications = mysqlTable(
  "user_certifications",
  {
    userId: int("user_id")
      .references(() => userProfile.id, { onDelete: "cascade" })
      .notNull(),
    certificationId: int("certification_id")
      .references(() => certifications.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.certificationId, table.userId] })],
);

// Relations
export const userCertificationsRelation = relations(
  certifications,
  ({ many }) => ({
    users: many(userCertifications),
  }),
);

export const userToCertificationsRelations = relations(
  userCertifications,
  ({ one }) => ({
    user: one(userProfile, {
      fields: [userCertifications.userId],
      references: [userProfile.id],
    }),
    certification: one(certifications, {
      fields: [userCertifications.certificationId],
      references: [certifications.id],
    }),
  }),
);

// Zod schemas for validation
export const selectCertificationsSchema = createSelectSchema(certifications);
export const insertCertificationsSchema = createInsertSchema(certifications, {
  certificationName: z
    .string()
    .min(1, "Certification name is required")
    .max(100),
});
export const updateCertificationsSchema = createUpdateSchema(
  certifications,
).omit({ id: true });

// Type exports
export type Certification = z.infer<typeof selectCertificationsSchema>;
export type NewCertification = z.infer<typeof insertCertificationsSchema>;
export type UpdateCertification = z.infer<typeof updateCertificationsSchema>;
