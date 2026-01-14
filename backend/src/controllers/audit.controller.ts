import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AuditService } from "@/services/audit.service";
import { ApiResponse } from "@/types";
import {
  AuditLogQuerySchema,
  AuditLogByIdSchema,
  UserAuditLogsSchema,
  ResourceAuditLogsSchema,
  IpAuditLogsSchema,
  AuditStatsQuerySchema,
  MyLogsQuerySchema,
} from "@/validations/audit.validation";

/**
 * Controller class for handling audit log-related API endpoints
 */
export class AuditController extends BaseController {
  private auditService: AuditService;

  constructor() {
    super();
    this.auditService = new AuditService();
  }

  /**
   * Retrieves all audit logs with filtering and pagination
   * @param req The Express request object with query parameters
   * @param res The Express response object
   */
  getAllLogs = async (
    req: Request<{}, {}, {}, AuditLogQuerySchema["query"]>,
    res: Response
  ) => {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resourceType,
      resourceId,
      severity,
      ipAddress,
      sessionId,
      startDate,
      endDate,
      search,
      success,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Parse dates if provided
    const filters = {
      userId: userId ? Number(userId) : undefined,
      action: action as any,
      resourceType: resourceType as any,
      resourceId: resourceId ? Number(resourceId) : undefined,
      severity: severity as any,
      ipAddress,
      sessionId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      success: success as any,
    };

    const result = await this.auditService.getLogs(filters, {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    if (result.isSuccess) {
      const pagination = {
        ...result.value.pagination,
        hasNext: result.value.pagination.page < result.value.pagination.totalPages,
        hasPrevious: result.value.pagination.page > 1,
        nextPage: result.value.pagination.page < result.value.pagination.totalPages ? result.value.pagination.page + 1 : null,
        previousPage: result.value.pagination.page > 1 ? result.value.pagination.page - 1 : null,
      };
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        pagination,
        "Audit logs retrieved successfully"
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves a single audit log by ID
   * @param req The Express request object with log ID parameter
   * @param res The Express response object
   */
  getLogById = async (
    req: Request<AuditLogByIdSchema["params"]>,
    res: Response
  ) => {
    const id = Number(req.params.id);

    const result = await this.auditService.getLogById(id);

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, "Audit log retrieved successfully");
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves audit logs for a specific user
   * @param req The Express request object with user ID parameter and query
   * @param res The Express response object
   */
  getUserLogs = async (
    req: Request<
      UserAuditLogsSchema["params"],
      {},
      {},
      UserAuditLogsSchema["query"]
    >,
    res: Response
  ) => {
    const userId = Number(req.params.userId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const result = await this.auditService.getUserLogs(userId, { page, limit });

    if (result.isSuccess) {
      const pagination = {
        ...result.value.pagination,
        hasNext: result.value.pagination.page < result.value.pagination.totalPages,
        hasPrevious: result.value.pagination.page > 1,
        nextPage: result.value.pagination.page < result.value.pagination.totalPages ? result.value.pagination.page + 1 : null,
        previousPage: result.value.pagination.page > 1 ? result.value.pagination.page - 1 : null,
      };
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        pagination,
        "User audit logs retrieved successfully"
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves audit logs for a specific resource
   * @param req The Express request object with resource type and ID
   * @param res The Express response object
   */
  getResourceLogs = async (
    req: Request<
      ResourceAuditLogsSchema["params"],
      {},
      {},
      ResourceAuditLogsSchema["query"]
    >,
    res: Response
  ) => {
    const { resourceType, resourceId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const result = await this.auditService.getResourceLogs(
      resourceType as any,
      Number(resourceId),
      { page, limit }
    );

    if (result.isSuccess) {
      const pagination = {
        ...result.value.pagination,
        hasNext: result.value.pagination.page < result.value.pagination.totalPages,
        hasPrevious: result.value.pagination.page > 1,
        nextPage: result.value.pagination.page < result.value.pagination.totalPages ? result.value.pagination.page + 1 : null,
        previousPage: result.value.pagination.page > 1 ? result.value.pagination.page - 1 : null,
      };
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        pagination,
        "Resource audit logs retrieved successfully"
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves audit logs by IP address
   * @param req The Express request object with IP address parameter
   * @param res The Express response object
   */
  getLogsByIpAddress = async (
    req: Request<IpAuditLogsSchema["params"], {}, {}, IpAuditLogsSchema["query"]>,
    res: Response
  ) => {
    const { ipAddress } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const result = await this.auditService.getLogsByIpAddress(ipAddress, {
      page,
      limit,
    });

    if (result.isSuccess) {
      const pagination = {
        ...result.value.pagination,
        hasNext: result.value.pagination.page < result.value.pagination.totalPages,
        hasPrevious: result.value.pagination.page > 1,
        nextPage: result.value.pagination.page < result.value.pagination.totalPages ? result.value.pagination.page + 1 : null,
        previousPage: result.value.pagination.page > 1 ? result.value.pagination.page - 1 : null,
      };
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        pagination,
        "IP address audit logs retrieved successfully"
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves audit statistics
   * @param req The Express request object with optional filters
   * @param res The Express response object
   */
  getStatistics = async (
    req: Request<{}, {}, {}, AuditStatsQuerySchema["query"]>,
    res: Response
  ) => {
    const { userId, startDate, endDate } = req.query;

    const filters = {
      userId: userId ? Number(userId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const result = await this.auditService.getStatistics(filters);

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Audit statistics retrieved successfully"
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves current user's own audit logs
   * @param req The Express request object
   * @param res The Express response object
   */
  getMyLogs = async (
    req: Request<{}, {}, {}, MyLogsQuerySchema["query"]>,
    res: Response
  ) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const result = await this.auditService.getUserLogs(req.userId!, {
      page,
      limit,
    });

    if (result.isSuccess) {
      const pagination = {
        ...result.value.pagination,
        hasNext: result.value.pagination.page < result.value.pagination.totalPages,
        hasPrevious: result.value.pagination.page > 1,
        nextPage: result.value.pagination.page < result.value.pagination.totalPages ? result.value.pagination.page + 1 : null,
        previousPage: result.value.pagination.page > 1 ? result.value.pagination.page - 1 : null,
      };
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        pagination,
        "Your audit logs retrieved successfully"
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Exports audit logs to CSV (admin only)
   * @param req The Express request object with query parameters
   * @param res The Express response object
   */
  exportLogs = async (
    req: Request<{}, {}, {}, AuditLogQuerySchema["query"]>,
    res: Response
  ) => {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      severity,
      startDate,
      endDate,
      search,
      success,
    } = req.query;

    const filters = {
      userId: userId ? Number(userId) : undefined,
      action: action as any,
      resourceType: resourceType as any,
      resourceId: resourceId ? Number(resourceId) : undefined,
      severity: severity as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      success: success as any,
    };

    // Get all logs matching filters (no pagination for export)
    const result = await this.auditService.getLogs(filters, {
      page: 1,
      limit: 10000, // Max export limit
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (result.isSuccess) {
      // Convert to CSV format
      const logs = result.value.items;
      const csvHeader =
        "ID,User ID,User Email,User Name,Action,Severity,Resource Type,Resource ID,IP Address,Session ID,Description,Success,Created At\n";

      const csvRows = logs
        .map((log) =>
          [
            log.id,
            log.userId || "",
            log.userEmail || "",
            log.userName || "",
            log.action,
            log.severity,
            log.resourceType || "",
            log.resourceId || "",
            log.ipAddress || "",
            log.sessionId || "",
            (log.description || "").replace(/,/g, ";"), // Escape commas
            log.success,
            log.createdAt,
          ].join(",")
        )
        .join("\n");

      const csv = csvHeader + csvRows;

      // Set headers for file download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`
      );

      return res.send(csv);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}