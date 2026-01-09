import { z } from "zod";
import {
  auditActionTypes,
  auditSeverityLevels,
  auditResourceTypes,
} from "@/db/schema/auditLogs";

/**
 * AUDIT VALIDATION SCHEMAS */

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Query schema for retrieving audit logs with filters and pagination
 */
export const auditLogQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    userId: z.string().optional(),
    action: z
      .enum(auditActionTypes)
      .or(z.array(z.enum(auditActionTypes)))
      .optional(),
    resourceType: z.enum(auditResourceTypes).optional(),
    resourceId: z.string().optional(),
    severity: z
      .enum(auditSeverityLevels)
      .or(z.array(z.enum(auditSeverityLevels)))
      .optional(),
    ipAddress: z.string().optional(),
    sessionId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
    success: z.enum(["true", "false", "partial"]).optional(),
    sortBy: z.enum(["createdAt", "severity"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

/**
 * Schema for audit statistics query parameters
 */
export const auditStatsQuerySchema = z.object({
  query: z.object({
    userId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

/**
 * Schema for my logs query parameters
 */
export const myLogsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

// ============================================================================
// PARAMS SCHEMAS
// ============================================================================

/**
 * Schema for audit log by ID
 */
export const auditLogByIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

/**
 * Schema for user audit logs
 */
export const userAuditLogsSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

/**
 * Schema for resource audit logs
 */
export const resourceAuditLogsSchema = z.object({
  params: z.object({
    resourceType: z.enum(auditResourceTypes),
    resourceId: z.string(),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

/**
 * Schema for IP address audit logs
 */
export const ipAuditLogsSchema = z.object({
  params: z.object({
    ipAddress: z.string(),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

// ============================================================================
// RESPONSE SCHEMAS (for Swagger)
// ============================================================================

/**
 * Audit log item schema for responses
 */
export const auditLogItemSchema = z.object({
  id: z.number(),
  userId: z.number().nullable(),
  userEmail: z.string().nullable(),
  userName: z.string().nullable(),
  action: z.enum(auditActionTypes),
  severity: z.enum(auditSeverityLevels),
  resourceType: z.enum(auditResourceTypes).nullable(),
  resourceId: z.number().nullable(),
  resourceIdentifier: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  sessionId: z.string().nullable(),
  oldValues: z.record(z.string(), z.any()).nullable(),
  newValues: z.record(z.string(), z.any()).nullable(),
  metadata: z.record(z.string(), z.any()).nullable(),
  description: z.string().nullable(),
  success: z.string(),
  errorMessage: z.string().nullable(),
  createdAt: z.date(),
});

/**
 * Audit statistics schema
 */
export const auditStatsSchema = z.object({
  total: z.number(),
  failed: z.number(),
  successRate: z.number(),
  actionCounts: z.array(
    z.object({
      action: z.enum(auditActionTypes),
      count: z.number(),
    })
  ),
  severityCounts: z.array(
    z.object({
      severity: z.enum(auditSeverityLevels),
      count: z.number(),
    })
  ),
  resourceCounts: z.array(
    z.object({
      resourceType: z.enum(auditResourceTypes).nullable(),
      count: z.number(),
    })
  ),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Inferred types for use in controllers and services
 */
export type AuditLogQuerySchema = z.infer<typeof auditLogQuerySchema>;
export type AuditLogByIdSchema = z.infer<typeof auditLogByIdSchema>;
export type UserAuditLogsSchema = z.infer<typeof userAuditLogsSchema>;
export type ResourceAuditLogsSchema = z.infer<typeof resourceAuditLogsSchema>;
export type IpAuditLogsSchema = z.infer<typeof ipAuditLogsSchema>;
export type AuditStatsQuerySchema = z.infer<typeof auditStatsQuerySchema>;
export type MyLogsQuerySchema = z.infer<typeof myLogsQuerySchema>;

export type AuditLogItem = z.infer<typeof auditLogItemSchema>;
export type AuditStats = z.infer<typeof auditStatsSchema>;