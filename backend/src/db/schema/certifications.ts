import {
  mysqlTable,
  varchar,
  int,
  primaryKey,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

import { userProfile } from "./users";

/**
 * Certifications table schema defining the structure for storing certification information.
 */
export const certifications = mysqlTable("certifications", {
  id: int("id").primaryKey().autoincrement(),
  certificationName: varchar("certification_name", { length: 100 }).notNull(),
});

/**
 * User certifications junction table schema linking users to their certifications.
 */
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
/**
 * Relations for the certifications table, defining many-to-many relationship with users through userCertifications.
 */
export const userCertificationsRelation = relations(
  certifications,
  ({ many }) => ({
    users: many(userCertifications),
  }),
);

/**
 * Relations for the userCertifications junction table, defining one-to-one relationships with userProfile and certifications.
 */
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
