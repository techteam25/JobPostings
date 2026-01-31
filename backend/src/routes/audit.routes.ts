import { Router } from "express";
import { z } from "zod";
import { AuditController } from "@/controllers/audit.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import { auditMiddleware } from "@/middleware/audit.middleware";
import validate from "@/middleware/validation.middleware";
import { registry } from "@/swagger/registry";
import {
  apiPaginatedResponseSchema,
  apiResponseSchema,
  errorResponseSchema,
} from "@/types";
import {
  // Import validation schemas
  auditLogQuerySchema,
  auditLogByIdSchema,
  userAuditLogsSchema,
  resourceAuditLogsSchema,
  ipAuditLogsSchema,
  auditStatsQuerySchema,
  myLogsQuerySchema,
  // Import response schemas for Swagger
  auditLogItemSchema,
  auditStatsSchema,
} from "@/validations/audit.validation";

const router = Router();
const auditController = new AuditController();
const authMiddleware = new AuthMiddleware();

// ============================================================================
// SWAGGER DOCUMENTATION & ROUTES
// ============================================================================

// All audit routes require authentication
router.use(authMiddleware.authenticate);

// ============================================================================
// GET /api/audit/logs - Get all audit logs with filtering (Admin)
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/audit/logs",
  tags: ["Audit Logs"],
  summary: "Get All Audit Logs",
  description:
    "Retrieve all audit logs with comprehensive filtering and pagination. " +
    "Supports filtering by user, action type, resource, IP address, date range, severity, and more. " +
    "Admin or Owner role required.",
  request: {
    query: auditLogQuerySchema.shape.query,
  },
  responses: {
    200: {
      description: "Audit logs retrieved successfully",
      content: {
        "application/json": {
          schema: apiPaginatedResponseSchema(auditLogItemSchema),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Insufficient permissions - Admin or Owner role required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Retrieves all audit logs with filtering and pagination.
 * This authenticated endpoint fetches system-wide audit logs with support for advanced filtering.
 * Requires admin or owner role for security monitoring and compliance.
 * 
 * Filters include:
 * - User ID, action type, resource type/ID
 * - IP address, session ID
 * - Date range (startDate/endDate)
 * - Severity level, success status
 * - Full-text search in descriptions
 * 
 * @route GET /audit/logs
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Sends a JSON response with paginated audit logs
 */
router.get(
  "/logs",
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  validate(auditLogQuerySchema),
  auditMiddleware.logAdminAction("admin.logs_view"),
  auditController.getAllLogs
);

// ============================================================================
// GET /api/audit/logs/export - Export audit logs to CSV (Admin)
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/audit/logs/export",
  tags: ["Audit Logs"],
  summary: "Export Audit Logs to CSV",
  description:
    "Export audit logs to CSV format with the same filtering options as the main logs endpoint. " +
    "Useful for compliance reports, security analysis, and archival. " +
    "Maximum 10,000 records per export. Admin or Owner role required.",
  request: {
    query: auditLogQuerySchema.shape.query,
  },
  responses: {
    200: {
      description: "CSV file generated successfully",
      content: {
        "text/csv": {
          schema: z.string(),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Insufficient permissions - Admin or Owner role required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Exports audit logs to CSV format.
 * This authenticated endpoint generates a downloadable CSV file of audit logs.
 * Supports the same filtering options as the main logs endpoint.
 * Requires admin or owner role.
 * Maximum 10,000 records per export for performance.
 * 
 * @route GET /audit/logs/export
 * @param {Object} req.query - Query parameters for filtering
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Sends a CSV file download
 */
router.get(
  "/logs/export",
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  validate(auditLogQuerySchema),
  auditController.exportLogs
);

// ============================================================================
// GET /api/audit/logs/:id - Get single audit log by ID (Admin)
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/audit/logs/{id}",
  tags: ["Audit Logs"],
  summary: "Get Audit Log by ID",
  description:
    "Retrieve a single audit log entry by its ID with complete details including " +
    "user information, action details, resource references, change tracking, and metadata. " +
    "Admin or Owner role required.",
  request: {
    params: auditLogByIdSchema.shape.params,
  },
  responses: {
    200: {
      description: "Audit log retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(auditLogItemSchema),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Insufficient permissions - Admin or Owner role required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Audit log not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Retrieves a single audit log by its ID.
 * This authenticated endpoint fetches detailed information about a specific audit log entry.
 * Includes complete details: user info, action type, resource references, 
 * before/after values, metadata, error information, and timestamps.
 * Requires admin or owner role.
 * 
 * @route GET /audit/logs/:id
 * @param {Object} req.params - Route parameters including the log ID
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Sends a JSON response with the audit log details
 */
router.get(
  "/logs/:id",
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  validate(auditLogByIdSchema),
  auditController.getLogById
);

// ============================================================================
// GET /api/audit/users/:userId/logs - Get logs for specific user (Admin)
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/audit/users/{userId}/logs",
  tags: ["Audit Logs"],
  summary: "Get Audit Logs for Specific User",
  description:
    "Retrieve all audit logs for a specific user ID with pagination. " +
    "Useful for user activity tracking, security investigations, and compliance audits. " +
    "Admin or Owner role required.",
  request: {
    params: userAuditLogsSchema.shape.params,
    query: userAuditLogsSchema.shape.query,
  },
  responses: {
    200: {
      description: "User audit logs retrieved successfully",
      content: {
        "application/json": {
          schema: apiPaginatedResponseSchema(auditLogItemSchema),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Insufficient permissions - Admin or Owner role required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Retrieves audit logs for a specific user with pagination.
 * This authenticated endpoint fetches all audit log entries associated with a user ID.
 * Includes authentication events, profile changes, job actions, applications, and more.
 * Requires admin or owner role for user activity monitoring.
 * 
 * @route GET /audit/users/:userId/logs
 * @param {Object} req.params - Route parameters including the user ID
 * @param {Object} req.query - Query parameters for pagination
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Sends a JSON response with paginated user audit logs
 */
router.get(
  "/users/:userId/logs",
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  validate(userAuditLogsSchema),
  auditController.getUserLogs
);

// ============================================================================
// GET /api/audit/resources/:resourceType/:resourceId/logs - Get logs for resource (Admin)
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/audit/resources/{resourceType}/{resourceId}/logs",
  tags: ["Audit Logs"],
  summary: "Get Audit Logs for Specific Resource",
  description:
    "Retrieve all audit logs for a specific resource (job, application, organization, etc.) " +
    "with pagination. Provides complete modification history and access tracking for the resource. " +
    "Admin or Owner role required.",
  request: {
    params: resourceAuditLogsSchema.shape.params,
    query: resourceAuditLogsSchema.shape.query,
  },
  responses: {
    200: {
      description: "Resource audit logs retrieved successfully",
      content: {
        "application/json": {
          schema: apiPaginatedResponseSchema(auditLogItemSchema),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Insufficient permissions - Admin or Owner role required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Resource not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Retrieves audit logs for a specific resource with pagination.
 * This authenticated endpoint fetches all audit log entries for a resource type and ID.
 * Tracks creation, updates, deletions, view access, and status changes.
 * Useful for compliance, debugging, and understanding resource lifecycle.
 * Requires admin or owner role.
 * 
 * @route GET /audit/resources/:resourceType/:resourceId/logs
 * @param {Object} req.params - Route parameters including resource type and ID
 * @param {Object} req.query - Query parameters for pagination
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Sends a JSON response with paginated resource audit logs
 */
router.get(
  "/resources/:resourceType/:resourceId/logs",
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  validate(resourceAuditLogsSchema),
  auditController.getResourceLogs
);

// ============================================================================
// GET /api/audit/ip/:ipAddress/logs - Get logs by IP address (Admin)
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/audit/ip/{ipAddress}/logs",
  tags: ["Audit Logs"],
  summary: "Get Audit Logs by IP Address",
  description:
    "Retrieve all audit logs associated with a specific IP address. " +
    "Critical for security monitoring, detecting suspicious activity, brute force attacks, " +
    "and identifying compromised accounts. Admin or Owner role required.",
  request: {
    params: ipAuditLogsSchema.shape.params,
    query: ipAuditLogsSchema.shape.query,
  },
  responses: {
    200: {
      description: "IP address audit logs retrieved successfully",
      content: {
        "application/json": {
          schema: apiPaginatedResponseSchema(auditLogItemSchema),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Insufficient permissions - Admin or Owner role required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Retrieves audit logs by IP address with pagination.
 * This authenticated endpoint fetches all audit log entries from a specific IP address.
 * Essential for security monitoring and threat detection:
 * - Multiple failed login attempts (brute force detection)
 * - Geographic anomalies
 * - Account takeover attempts
 * - Suspicious activity patterns
 * Requires admin or owner role.
 * 
 * @route GET /audit/ip/:ipAddress/logs
 * @param {Object} req.params - Route parameters including the IP address
 * @param {Object} req.query - Query parameters for pagination
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Sends a JSON response with paginated IP audit logs
 */
router.get(
  "/ip/:ipAddress/logs",
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  validate(ipAuditLogsSchema),
  auditController.getLogsByIpAddress
);

// ============================================================================
// GET /api/audit/stats - Get audit statistics (Admin)
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/audit/stats",
  tags: ["Audit Logs"],
  summary: "Get Audit Statistics",
  description:
    "Retrieve aggregated audit log statistics including total events, failed attempts, " +
    "success rates, and breakdowns by action type, severity, and resource type. " +
    "Optionally filter by user ID or date range. Admin or Owner role required.",
  request: {
    query: auditStatsQuerySchema.shape.query,
  },
  responses: {
    200: {
      description: "Audit statistics retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(auditStatsSchema),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Insufficient permissions - Admin or Owner role required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Retrieves audit statistics with optional filters.
 * This authenticated endpoint provides aggregated metrics for audit logs:
 * - Total events and failed attempts
 * - Success rate percentage
 * - Action type distribution
 * - Severity level distribution
 * - Resource type distribution
 * 
 * Optionally filter by user ID or date range for targeted analysis.
 * Useful for dashboards, reports, and system health monitoring.
 * Requires admin or owner role.
 * 
 * @route GET /audit/stats
 * @param {Object} req.query - Query parameters for filtering (userId, startDate, endDate)
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Sends a JSON response with audit statistics
 */
router.get(
  "/stats",
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  validate(auditStatsQuerySchema),
  auditController.getStatistics
);

// ============================================================================
// GET /api/audit/me/logs - Get current user's own logs
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/audit/me/logs",
  tags: ["Audit Logs"],
  summary: "Get My Audit Logs",
  description:
    "Retrieve the audit logs for the currently authenticated user. " +
    "Users can view their own activity history including logins, profile changes, " +
    "job applications, and other actions. Supports pagination.",
  request: {
    query: myLogsQuerySchema.shape.query,
  },
  responses: {
    200: {
      description: "Current user's audit logs retrieved successfully",
      content: {
        "application/json": {
          schema: apiPaginatedResponseSchema(auditLogItemSchema),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Retrieves the current user's own audit logs with pagination.
 * This authenticated endpoint allows users to view their personal activity history.
 * Provides transparency and allows users to:
 * - Review their login history
 * - Track profile changes
 * - View job applications and saved jobs
 * - Monitor account activity
 * 
 * No special role required - users can always view their own audit logs.
 * 
 * @route GET /audit/me/logs
 * @param {Object} req.query - Query parameters for pagination
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Sends a JSON response with paginated user audit logs
 */
router.get(
  "/me/logs",
  validate(myLogsQuerySchema),
  auditController.getMyLogs
);

export default router;