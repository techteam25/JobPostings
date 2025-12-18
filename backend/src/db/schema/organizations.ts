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
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { user } from "./users";
import { jobInsights, jobsDetails } from "./jobsDetails";
import type { FileMetadata } from "@/validations/file.validation";

/**
 * Organizations table schema defining the structure for storing organization information.
 */
export const organizations = mysqlTable(
  "organizations",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 100 }).notNull(),
    streetAddress: varchar("street_address", { length: 100 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    country: varchar("country", { length: 100 }).notNull(),
    zipCode: varchar("zip_code", { length: 20 }).notNull(),
    phone: varchar("phone", { length: 50 }),
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
    fileMetadata: json("file_metadata").$type<FileMetadata[]>(),
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

/**
 * Organization members table schema defining the structure for storing organization memberships.
 */
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
/**
 * Relations for the organizations table, defining relationships with job insights, members, and job posts.
 */
export const organizationRelations = relations(organizations, ({ many }) => ({
  jobInsights: many(jobInsights),
  members: many(organizationMembers),
  jobPosts: many(jobsDetails),
}));

/**
 * Relations for the organizationMembers table, defining relationships with user and organization.
 */
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
