import {
  mysqlTable,
  serial,
  timestamp,
  int,
  text,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";
import { users } from "./users";

export const auth = mysqlTable("auth", {
  id: serial("id").primaryKey(),
  userId: int("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Relations
export const authRelations = relations(auth, ({ one }) => ({
  authentication: one(users, {
    fields: [auth.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const selectAuthSchema = createSelectSchema(auth);
export const insertAuthSchema = createInsertSchema(auth);
export const updateAuthSchema = insertAuthSchema
  .partial()
  .omit({ id: true, userId: true, createdAt: true });

// Type exports
export type UserAuth = z.infer<typeof selectAuthSchema>;
export type UpdateAuth = z.infer<typeof updateAuthSchema>;
export type InsertAuth = z.infer<typeof insertAuthSchema>;
