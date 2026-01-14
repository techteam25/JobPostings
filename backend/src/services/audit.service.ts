import { Request } from "express";
import { AuditRepository } from "@/repositories/audit.repository";
import { BaseService, ok, fail } from "./base.service";
import {
  AuditActionType,
  AuditSeverityLevel,
  AuditResourceType,
  NewAuditLog,
} from "@/db/schema/auditLogs";
import { DatabaseError, AppError } from "@/utils/errors";

/**
 * Service class for managing audit log operations
 */
export class AuditService extends BaseService {
  private auditRepository: AuditRepository;

  constructor() {
    super();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Logs an audit event
   * @param params Audit log parameters
   * @returns Result indicating success or failure
   */
  async log(params: {
    userId?: number;
    userEmail?: string;
    action: AuditActionType;
    severity?: AuditSeverityLevel;
    resourceType?: AuditResourceType;
    resourceId?: number;
    resourceIdentifier?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    description?: string;
    success?: "true" | "false" | "partial";
    errorMessage?: string;
    errorStack?: string;
  }) {
    try {
      const logData: NewAuditLog = {
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        severity: params.severity || "info",
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceIdentifier: params.resourceIdentifier,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sessionId: params.sessionId,
        oldValues: params.oldValues,
        newValues: params.newValues,
        metadata: params.metadata,
        description: params.description,
        success: params.success || "true",
        errorMessage: params.errorMessage,
        errorStack: params.errorStack,
      };

      const log = await this.auditRepository.createLog(logData);
      return ok(log);
    } catch (error) {
      // Log audit failures but don't throw - we don't want to break app flow
      console.error("Failed to create audit log:", error);
      return fail(new DatabaseError("Failed to create audit log"));
    }
  }

  /**
   * Logs an audit event from an Express request
   * @param req Express request object
   * @param action Action type
   * @param params Additional parameters
   * @returns Result indicating success or failure
   */
  async logFromRequest(
    req: Request,
    action: AuditActionType,
    params?: {
      severity?: AuditSeverityLevel;
      resourceType?: AuditResourceType;
      resourceId?: number;
      resourceIdentifier?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      metadata?: Record<string, any>;
      description?: string;
      success?: "true" | "false" | "partial";
      errorMessage?: string;
    }
  ) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;

    return this.log({
      userId: req.userId,
      userEmail: req.user?.email,
      action,
      severity: params?.severity,
      resourceType: params?.resourceType,
      resourceId: params?.resourceId,
      resourceIdentifier: params?.resourceIdentifier,
      ipAddress,
      userAgent: req.headers["user-agent"],
      sessionId: req.headers["authorization"]?.split(" ")[1], // Extract token if Bearer auth
      oldValues: params?.oldValues,
      newValues: params?.newValues,
      metadata: {
        ...params?.metadata,
        method: req.method,
        path: req.path,
        query: req.query,
      },
      description: params?.description,
      success: params?.success,
      errorMessage: params?.errorMessage,
    });
  }

  /**
   * Retrieves audit logs with filtering and pagination
   * @param filters Query filters
   * @param options Pagination options
   * @returns Result with paginated audit logs
   */
  async getLogs(
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
      search?: string;
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
      const result = await this.auditRepository.findLogs(filters, options);
      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve audit logs"));
    }
  }

  /**
   * Retrieves a single audit log by ID
   * @param id The audit log ID
   * @returns Result with the audit log
   */
  async getLogById(id: number) {
    try {
      const log = await this.auditRepository.findById(id);
      if (!log) {
        return fail(new DatabaseError("Audit log not found"));
      }
      return ok(log);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve audit log"));
    }
  }

  /**
   * Retrieves audit logs for a specific user
   * @param userId The user ID
   * @param options Pagination options
   * @returns Result with paginated audit logs
   */
  async getUserLogs(
    userId: number,
    options: { page: number; limit: number }
  ) {
    try {
      const result = await this.auditRepository.findLogsByUser(userId, options);
      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve user audit logs"));
    }
  }

  /**
   * Retrieves audit logs for a specific resource
   * @param resourceType The resource type
   * @param resourceId The resource ID
   * @param options Pagination options
   * @returns Result with paginated audit logs
   */
  async getResourceLogs(
    resourceType: AuditResourceType,
    resourceId: number,
    options: { page: number; limit: number }
  ) {
    try {
      const result = await this.auditRepository.findLogsByResource(
        resourceType,
        resourceId,
        options
      );
      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve resource audit logs"));
    }
  }

  /**
   * Retrieves audit logs by IP address
   * @param ipAddress The IP address
   * @param options Pagination options
   * @returns Result with paginated audit logs
   */
  async getLogsByIpAddress(
    ipAddress: string,
    options: { page: number; limit: number }
  ) {
    try {
      const result = await this.auditRepository.findLogsByIpAddress(
        ipAddress,
        options
      );
      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve audit logs by IP"));
    }
  }

  /**
   * Retrieves audit statistics
   * @param filters Optional filters
   * @returns Result with audit statistics
   */
  async getStatistics(filters?: {
    userId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const stats = await this.auditRepository.getStatistics(filters);
      return ok(stats);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve audit statistics"));
    }
  }

  /**
   * Deletes old audit logs based on retention policy
   * @param retentionDays Number of days to retain logs
   * @returns Result indicating success or failure
   */
  async cleanupOldLogs(retentionDays: number = 90) {
    try {
      const result = await this.auditRepository.deleteOldLogs(retentionDays);
      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to cleanup old audit logs"));
    }
  }

  /**
   * Helper method to log authentication events
   */
  async logAuthEvent(params: {
    userId?: number;
    userEmail: string;
    action: Extract<
      AuditActionType,
      | "auth.login"
      | "auth.logout"
      | "auth.register"
      | "auth.password_change"
      | "auth.password_reset"
      | "auth.email_verification"
    >;
    ipAddress?: string;
    userAgent?: string;
    success?: "true" | "false";
    errorMessage?: string;
  }) {
    return this.log({
      ...params,
      severity: params.success === "false" ? "warning" : "info",
      resourceType: "session",
      description: `User ${params.action.replace("auth.", "")}`,
    });
  }

  /**
   * Helper method to log user modification events
   */
  async logUserEvent(params: {
    userId: number;
    userEmail: string;
    action: Extract<
      AuditActionType,
      | "user.create"
      | "user.update"
      | "user.delete"
      | "user.deactivate"
      | "user.activate"
      | "user.profile_update"
      | "user.profile_visibility_change"
    >;
    targetUserId?: number;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.log({
      ...params,
      severity: params.action.includes("delete") ? "warning" : "info",
      resourceType: "user",
      resourceId: params.targetUserId || params.userId,
      description: `User ${params.action.replace("user.", "")}`,
    });
  }

  /**
   * Helper method to log job-related events
   */
  async logJobEvent(params: {
    userId: number;
    userEmail: string;
    action: Extract<
      AuditActionType,
      | "job.create"
      | "job.update"
      | "job.delete"
      | "job.publish"
      | "job.unpublish"
      | "job.view"
    >;
    jobId: number;
    jobTitle?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.log({
      ...params,
      severity: params.action === "job.delete" ? "warning" : "info",
      resourceType: "job",
      resourceId: params.jobId,
      resourceIdentifier: params.jobTitle,
      description: `Job ${params.action.replace("job.", "")}`,
    });
  }

  /**
   * Helper method to log application events
   */
  async logApplicationEvent(params: {
    userId: number;
    userEmail: string;
    action: Extract<
      AuditActionType,
      | "application.create"
      | "application.update"
      | "application.withdraw"
      | "application.status_change"
      | "application.view"
    >;
    applicationId: number;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.log({
      ...params,
      severity: "info",
      resourceType: "application",
      resourceId: params.applicationId,
      description: `Application ${params.action.replace("application.", "")}`,
    });
  }
}