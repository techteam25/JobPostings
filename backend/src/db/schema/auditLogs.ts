import {
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
  mysqlEnum,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { user } from "./users";

/**
 * Audit log action types
 */
export const auditActionTypes = [
  // Authentication actions
  "auth.login",
  "auth.logout",
  "auth.register",
  "auth.password_change",
  "auth.password_reset",
  "auth.email_verification",
  
  // User actions
  "user.create",
  "user.update",
  "user.delete",
  "user.deactivate",
  "user.activate",
  "user.profile_update",
  "user.profile_visibility_change",
  
  // Organization actions
  "organization.create",
  "organization.update",
  "organization.delete",
  "organization.member_add",
  "organization.member_remove",
  "organization.member_role_change",
  
  // Job actions
  "job.create",
  "job.update",
  "job.delete",
  "job.publish",
  "job.unpublish",
  "job.view",
  
  // Application actions
  "application.create",
  "application.update",
  "application.withdraw",
  "application.status_change",
  "application.view",
  
  // Saved jobs actions
  "saved_job.add",
  "saved_job.remove",
  
  // Email preference actions
  "email_preferences.update",
  "email_preferences.unsubscribe",
  "email_preferences.resubscribe",
  
  // File actions
  "file.upload",
  "file.delete",
  "file.view",
  
  // Admin actions
  "admin.user_deactivate",
  "admin.user_delete",
  "admin.logs_view",
  
  // System actions
  "system.error",
  "system.warning",
] as const;

/**
 * Audit log severity levels
 */
export const auditSeverityLevels = [
  "info",
  "warning",
  "error",
  "critical",
] as const;

/**
 * Audit log resource types
 */
export const auditResourceTypes = [
  "user",
  "user_profile",
  "organization",
  "organization_member",
  "job",
  "application",
  "saved_job",
  "email_preferences",
  "file",
  "session",
  "account",
] as const;

/**
 * Audit logs table schema for tracking all system activities
 */
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    
    // User information
    userId: int("user_id").references(() => user.id, { onDelete: "set null" }),
    userEmail: varchar("user_email", { length: 255 }),
    
    // Action information
    action: mysqlEnum("action", auditActionTypes).notNull(),
    severity: mysqlEnum("severity", auditSeverityLevels)
      .default("info")
      .notNull(),
    
    // Resource information
    resourceType: mysqlEnum("resource_type", auditResourceTypes),
    resourceId: int("resource_id"),
    resourceIdentifier: varchar("resource_identifier", { length: 255 }), // For non-integer IDs or additional context
    
    // Request information
    ipAddress: varchar("ip_address", { length: 45 }), // IPv6 compatible
    userAgent: text("user_agent"),
    sessionId: varchar("session_id", { length: 255 }),
    
    // Change tracking
    oldValues: json("old_values").$type<Record<string, any>>(), // Previous state
    newValues: json("new_values").$type<Record<string, any>>(), // New state
    
    // Additional context
    metadata: json("metadata").$type<Record<string, any>>(), // Extra context data
    description: text("description"), // Human-readable description
    
    // Status and error information
    success: varchar("success", { length: 20 }).default("true").notNull(), // 'true', 'false', 'partial'
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    
    // Timestamps
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    // Indexes for efficient querying
    index("idx_audit_logs_user_id").on(table.userId),
    index("idx_audit_logs_action").on(table.action),
    index("idx_audit_logs_resource").on(table.resourceType, table.resourceId),
    index("idx_audit_logs_created_at").on(table.createdAt),
    index("idx_audit_logs_severity").on(table.severity),
    index("idx_audit_logs_session_id").on(table.sessionId),
    index("idx_audit_logs_ip_address").on(table.ipAddress),
    
    // Composite indexes for common query patterns
    index("idx_audit_logs_user_action").on(table.userId, table.action),
    index("idx_audit_logs_user_date").on(table.userId, table.createdAt),
    index("idx_audit_logs_resource_date").on(
      table.resourceType,
      table.resourceId,
      table.createdAt
    ),
  ]
);

/**
 * Relations for the audit logs table
 */
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(user, {
    fields: [auditLogs.userId],
    references: [user.id],
  }),
}));

/**
 * Type exports for TypeScript
 */
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type AuditActionType = (typeof auditActionTypes)[number];
export type AuditSeverityLevel = (typeof auditSeverityLevels)[number];
export type AuditResourceType = (typeof auditResourceTypes)[number];