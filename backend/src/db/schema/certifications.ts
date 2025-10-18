import { mysqlTable, varchar, int, primaryKey, foreignKey } from "drizzle-orm/mysql-core";
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
    userId: int("user_id").notNull(),
    certificationId: int("certification_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.certificationId, table.userId] }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userProfile.id],
      name: "user_certifications_user_id_user_profile_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.certificationId],
      foreignColumns: [certifications.id],
      name: "user_certifications_certification_id_certifications_id_fk",
    }).onDelete("cascade"),
  ],
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

// Zod schemas
export const selectCertificationsSchema = createSelectSchema(certifications);
export const insertCertificationsSchema = createInsertSchema(certifications, {
  certificationName: z
    .string()
    .min(1, "Certification name is required")
    .max(100),
});
export const updateCertificationsSchema = createUpdateSchema(certifications).omit({
  id: true,
});

export type Certification = z.infer<typeof selectCertificationsSchema>;
export type NewCertification = z.infer<typeof insertCertificationsSchema>;
export type UpdateCertification = z.infer<typeof updateCertificationsSchema>;
