import { eq, and, gte, lte, desc, sql, or, like, count } from "drizzle-orm";
import { db } from "@/db/connection";
import {
  auditLogs,
  NewAuditLog,
  AuditActionType,
  AuditSeverityLevel,
  AuditResourceType,
} from "@/db/schema/auditLogs";
import { user } from "@/db/schema/users";

/**
 * Repository class for managing audit log database operations
 */
export class AuditRepository {
  /**
   * Creates a new audit log entry
   * @param logData The audit log data to insert
   * @returns The created audit log or null
   */
  async createLog(logData: NewAuditLog) {
    try {
      const [log] = await db.insert(auditLogs).values(logData);
      return log;
    } catch (error) {
      console.error("Failed to create audit log:", error);
      return null;
    }
  }

  /**
   * Retrieves audit logs with filtering and pagination
   * @param filters Query filters
   * @param options Pagination options
   * @returns Paginated audit logs
   */
  async findLogs(
    filters: {
      userId?: number;
      action?: AuditActionType | AuditActionType[];
      resourceType?: AuditResourceType;
      resourceId?: number;
      severity?: AuditSeverityLevel | AuditSeverityLevel[];
      ipAddress?: string;
      sessionId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string; // Search in description, email, or resource identifier
      success?: "true" | "false" | "partial";
    },
    options: {
      page: number;
      limit: number;
      sortBy?: "createdAt" | "severity";
      sortOrder?: "asc" | "desc";
    }
  ) {
    try {
      const conditions = [];

      // Build WHERE conditions
      if (filters.userId) {
        conditions.push(eq(auditLogs.userId, filters.userId));
      }

      if (filters.action) {
        if (Array.isArray(filters.action)) {
          conditions.push(
            or(...filters.action.map((a) => eq(auditLogs.action, a)))!
          );
        } else {
          conditions.push(eq(auditLogs.action, filters.action));
        }
      }

      if (filters.resourceType) {
        conditions.push(eq(auditLogs.resourceType, filters.resourceType));
      }

      if (filters.resourceId) {
        conditions.push(eq(auditLogs.resourceId, filters.resourceId));
      }

      if (filters.severity) {
        if (Array.isArray(filters.severity)) {
          conditions.push(
            or(...filters.severity.map((s) => eq(auditLogs.severity, s)))!
          );
        } else {
          conditions.push(eq(auditLogs.severity, filters.severity));
        }
      }

      if (filters.ipAddress) {
        conditions.push(eq(auditLogs.ipAddress, filters.ipAddress));
      }

      if (filters.sessionId) {
        conditions.push(eq(auditLogs.sessionId, filters.sessionId));
      }

      if (filters.startDate) {
        conditions.push(gte(auditLogs.createdAt, filters.startDate));
      }

      if (filters.endDate) {
        conditions.push(lte(auditLogs.createdAt, filters.endDate));
      }

      if (filters.success) {
        conditions.push(eq(auditLogs.success, filters.success));
      }

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(
          or(
            like(auditLogs.description, searchPattern),
            like(auditLogs.userEmail, searchPattern),
            like(auditLogs.resourceIdentifier, searchPattern)
          )!
        );
      }

      // Calculate offset
      const offset = (options.page - 1) * options.limit;

      // Determine sort column and order
      const sortColumn =
        options.sortBy === "severity" ? auditLogs.severity : auditLogs.createdAt;
      const sortOrder = options.sortOrder === "asc" ? sortColumn : desc(sortColumn);

      // Execute query with joins
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const logs = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          userEmail: auditLogs.userEmail,
          userName: user.fullName,
          action: auditLogs.action,
          severity: auditLogs.severity,
          resourceType: auditLogs.resourceType,
          resourceId: auditLogs.resourceId,
          resourceIdentifier: auditLogs.resourceIdentifier,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          sessionId: auditLogs.sessionId,
          oldValues: auditLogs.oldValues,
          newValues: auditLogs.newValues,
          metadata: auditLogs.metadata,
          description: auditLogs.description,
          success: auditLogs.success,
          errorMessage: auditLogs.errorMessage,
          errorStack: auditLogs.errorStack,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(user, eq(auditLogs.userId, user.id))
        .where(whereClause)
        .orderBy(sortOrder)
        .limit(options.limit)
        .offset(offset);

      // Get total count for pagination
      const totalResult = await db
        .select({ total: count() })
        .from(auditLogs)
        .where(whereClause);
      const total = totalResult[0]?.total ?? 0; 
      return {
        items: logs,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit),
        },
      };
    } catch (error) {
      console.error("Failed to retrieve audit logs:", error);
      throw error;
    }
  }

  /**
   * Retrieves a single audit log by ID
   * @param id The audit log ID
   * @returns The audit log or null
   */
  async findById(id: number) {
    try {
      const [log] = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          userEmail: auditLogs.userEmail,
          userName: user.fullName,
          action: auditLogs.action,
          severity: auditLogs.severity,
          resourceType: auditLogs.resourceType,
          resourceId: auditLogs.resourceId,
          resourceIdentifier: auditLogs.resourceIdentifier,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          sessionId: auditLogs.sessionId,
          oldValues: auditLogs.oldValues,
          newValues: auditLogs.newValues,
          metadata: auditLogs.metadata,
          description: auditLogs.description,
          success: auditLogs.success,
          errorMessage: auditLogs.errorMessage,
          errorStack: auditLogs.errorStack,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(user, eq(auditLogs.userId, user.id))
        .where(eq(auditLogs.id, id));

      return log || null;
    } catch (error) {
      console.error("Failed to retrieve audit log:", error);
      return null;
    }
  }

  /**
   * Retrieves audit logs for a specific user
   * @param userId The user ID
   * @param options Pagination options
   * @returns Paginated audit logs
   */
  async findLogsByUser(
    userId: number,
    options: { page: number; limit: number }
  ) {
    return this.findLogs({ userId }, options);
  }

  /**
   * Retrieves audit logs for a specific resource
   * @param resourceType The resource type
   * @param resourceId The resource ID
   * @param options Pagination options
   * @returns Paginated audit logs
   */
  async findLogsByResource(
    resourceType: AuditResourceType,
    resourceId: number,
    options: { page: number; limit: number }
  ) {
    return this.findLogs({ resourceType, resourceId }, options);
  }

  /**
   * Retrieves audit logs by IP address
   * @param ipAddress The IP address
   * @param options Pagination options
   * @returns Paginated audit logs
   */
  async findLogsByIpAddress(
    ipAddress: string,
    options: { page: number; limit: number }
  ) {
    return this.findLogs({ ipAddress }, options);
  }

  /**
   * Retrieves audit statistics
   * @param filters Optional filters
   * @returns Audit statistics
   */
  async getStatistics(filters?: {
    userId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const conditions = [];

      if (filters?.userId) {
        conditions.push(eq(auditLogs.userId, filters.userId));
      }

      if (filters?.startDate) {
        conditions.push(gte(auditLogs.createdAt, filters.startDate));
      }

      if (filters?.endDate) {
        conditions.push(lte(auditLogs.createdAt, filters.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get action counts
      const actionCounts = await db
        .select({
          action: auditLogs.action,
          count: count(),
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.action);

      // Get severity counts
      const severityCounts = await db
        .select({
          severity: auditLogs.severity,
          count: count(),
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.severity);

      // Get resource type counts
      const resourceCounts = await db
        .select({
          resourceType: auditLogs.resourceType,
          count: count(),
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.resourceType);

      // Get total counts
      const totalResult = await db
        .select({ total: count() })
        .from(auditLogs)
        .where(whereClause);
      const total = totalResult[0]?.total ?? 0;

      // Get failed action counts
      const failedResult = await db
        .select({ failed: count() })
        .from(auditLogs)
        .where(
          conditions.length > 0
            ? and(...conditions, eq(auditLogs.success, "false"))
            : eq(auditLogs.success, "false")
        );
      const failed = failedResult[0]?.failed ?? 0;

      return {
        total,
        failed,
        successRate: total > 0 ? ((total - failed) / total) * 100 : 100,
        actionCounts,
        severityCounts,
        resourceCounts,
      };
    } catch (error) {
      console.error("Failed to retrieve audit statistics:", error);
      throw error;
    }
  }

  /**
   * Deletes old audit logs based on retention policy
   * @param retentionDays Number of days to retain logs
   * @returns Number of deleted logs
   */
  async deleteOldLogs(retentionDays: number) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await db
        .delete(auditLogs)
        .where(lte(auditLogs.createdAt, cutoffDate));

      return result;
    } catch (error) {
      console.error("Failed to delete old audit logs:", error);
      throw error;
    }
  }
}