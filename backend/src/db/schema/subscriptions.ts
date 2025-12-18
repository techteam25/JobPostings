import {
  mysqlTable,
  serial,
  varchar,
  timestamp,
  boolean,
  int,
  decimal,
  index,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";

/**
 * Subscriptions table schema defining the structure for storing organization subscription information.
 */
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    organizationId: int("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    providerId: varchar("provider_id", { length: 100 }).notNull(), // Stripe customer ID, etc.
    planType: varchar("plan_type", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(), // active, canceled, past_due, etc.
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("organization_idx").on(table.organizationId),
    index("status_idx").on(table.status),
    index("provider_idx").on(table.providerId),
  ],
);

// Relations
/**
 * Relations for the subscriptions table, defining one-to-one relationship with organizations.
 */
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
}));

// Zod schemas
/**
 * Zod schema for selecting subscription data.
 */
export const selectSubscriptionSchema = createSelectSchema(subscriptions);

/**
 * Zod schema for inserting new subscription data.
 */
export const insertSubscriptionSchema = createInsertSchema(subscriptions);

/**
 * Zod schema for updating subscription data, omitting id and createdAt.
 */
export const updateSubscriptionSchema = insertSubscriptionSchema
  .partial()
  .omit({ id: true, createdAt: true });

// Type exports
/**
 * TypeScript type for subscription data.
 */
export type Subscription = z.infer<typeof selectSubscriptionSchema>;

/**
 * TypeScript type for new subscription data.
 */
export type NewSubscription = z.infer<typeof insertSubscriptionSchema>;

/**
 * TypeScript type for updating subscription data.
 */
export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;
