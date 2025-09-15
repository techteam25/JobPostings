import {
  mysqlTable,
  serial,
  varchar,
  int,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { userProfile } from "./users";

export const certifications = mysqlTable("certifications", {
  id: serial("id").primaryKey(),
  certificationName: varchar("certification_name", { length: 100 }).notNull(),
});

export const userCertifications = mysqlTable(
  "user_certifications",
  {
    userId: int("user_id")
      .references(() => userProfile.id)
      .notNull(),
    certificationId: int("certification_id")
      .references(() => certifications.id)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.certificationId, table.userId] })],
);
