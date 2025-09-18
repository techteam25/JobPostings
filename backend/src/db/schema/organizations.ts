import {
  mysqlTable,
  serial,
  varchar,
  timestamp,
  text,
  index,
  int,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

export const organizations = mysqlTable(
  "organizations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    streetAddress: varchar("street_address", { length: 100 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    zipCode: varchar("zip_code", { length: 5 }).notNull(),
    phone: varchar("phone", { length: 15 }),
    contact: int("contact").notNull(),
    url: varchar("url", { length: 255 }).notNull(),
    mission: text("mission").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("organization_name_idx").on(table.name),
    index("state_idx").on(table.state),
    index("city_idx").on(table.city),
    index("zip_idx").on(table.zipCode),
  ],
);

// Relations
export const organizationRelations = relations(organizations, ({ many }) => ({
  contact: many(users),
}));

// Zod schemas for validation
export const selectOrganizationSchema = createSelectSchema(organizations);
export const insertOrganizationSchema = createInsertSchema(organizations, {
  name: z.string().min(5, "Name must be at least 5 characters").max(100),
  url: z.url("Invalid organization website URL"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 characters")
    .max(10)
    .optional(),
});
export const updateOrganizationSchema = insertOrganizationSchema
  .partial()
  .omit({ id: true, createdAt: true });

export type NewOrganization = z.infer<typeof insertOrganizationSchema>;
