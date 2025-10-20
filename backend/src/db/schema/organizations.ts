import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./users";
import { jobInsights } from "./jobsDetails";

export const organizations = mysqlTable(
  "organizations",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 100 }).notNull(),
    streetAddress: varchar("street_address", { length: 100 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    zipCode: varchar("zip_code", { length: 5 }).notNull(),
    phone: varchar("phone", { length: 15 }),
    contact: int("contact").notNull(),
    url: varchar("url", { length: 255 }).notNull(),
    logoUrl: varchar("logo_url", { length: 500 }),
    mission: text("mission").notNull(),
    subscriptionTier: mysqlEnum("subscription_tier", [
      "free",
      "basic",
      "professional",
      "enterprise",
    ])
      .default("free")
      .notNull(),
    subscriptionStatus: mysqlEnum("subscription_status", [
      "active",
      "cancelled",
      "expired",
      "trial",
    ])
      .default("trial")
      .notNull(),
    subscriptionStartDate: timestamp("subscription_start_date"),
    subscriptionEndDate: timestamp("subscription_end_date"),
    jobPostingLimit: int("job_posting_limit").default(1), // Based on tier
    status: mysqlEnum("status", ["active", "suspended", "deleted"])
      .default("active")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("organization_name_idx").on(table.name),
    index("state_idx").on(table.state),
    index("city_idx").on(table.city),
    index("zip_idx").on(table.zipCode),
    index("idx_subscription_status").on(table.subscriptionStatus),
  ],
);

export const organizationMembers = mysqlTable(
  "organization_members",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "admin", "recruiter", "member"])
      .default("member")
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    // Prevent duplicate memberships
    unique("unique_user_org").on(table.userId, table.organizationId),
    index("idx_org_members_user").on(table.userId),
    index("idx_org_members_org").on(table.organizationId),
  ],
);

// Relations
export const organizationRelations = relations(organizations, ({ many }) => ({
  contact: many(user),
  jobInsights: many(jobInsights),
  members: many(organizationMembers),
}));

export const organizationMemberRelations = relations(
  organizationMembers,
  ({ one }) => ({
    user: one(user, {
      fields: [organizationMembers.userId],
      references: [user.id],
    }),
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
  }),
);

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
export type Organization = z.infer<typeof selectOrganizationSchema>;
