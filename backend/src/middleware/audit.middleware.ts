import { Request, Response, NextFunction } from "express";
import { AuditService } from "@/services/audit.service";
import { AuditActionType } from "@/db/schema/auditLogs";

/**
 * Middleware class for automatic audit logging
 */
export class AuditMiddleware {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Generic audit logging middleware
   * Logs request details for auditing purposes
   */
  logRequest = (action: AuditActionType, description?: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Store original end function
      const originalEnd = res.end;
      const startTime = Date.now();
      const auditService = this.auditService;

      // Override end function to capture response
      res.end = function (this: Response, ...args: any[]) {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400 ? "true" : "false";

        // Log the request asynchronously (don't await to not block response)
        auditService
          .logFromRequest(req, action, {
            description: description || `${req.method} ${req.path}`,
            success: success as "true" | "false",
            metadata: { statusCode: res.statusCode, duration },
          })
          .then(() => {
            console.log(`✅ Audit log created for ${action}`);
          })
          .catch((error) => {
            console.error("❌ Failed to log audit trail:", error);
          });
        // Call original end function
        return originalEnd.apply(this, args as Parameters<typeof originalEnd>);
      };

      next();
    };
  };

  /**
   * Logs user authentication events
   */
  logAuth = (
    action: Extract<
      AuditActionType,
      | "auth.login"
      | "auth.logout"
      | "auth.register"
      | "auth.password_change"
      | "auth.password_reset"
      | "auth.email_verification"
    >
  ) => {
    return this.logRequest(action, `Authentication: ${action}`);
  };

  /**
   * Logs user management events
   */
  logUserManagement = (
    action: Extract<
      AuditActionType,
      | "user.create"
      | "user.update"
      | "user.delete"
      | "user.deactivate"
      | "user.activate"
      | "user.profile_update"
      | "user.profile_visibility_change"
    >
  ) => {
    return this.logRequest(action, `User management: ${action}`);
  };

  /**
   * Logs organization management events
   */
  logOrganizationManagement = (
    action: Extract<
      AuditActionType,
      | "organization.create"
      | "organization.update"
      | "organization.delete"
      | "organization.member_add"
      | "organization.member_remove"
      | "organization.member_role_change"
    >
  ) => {
    return this.logRequest(action, `Organization management: ${action}`);
  };

  /**
   * Logs job-related events
   */
  logJobAction = (
    action: Extract<
      AuditActionType,
      | "job.create"
      | "job.update"
      | "job.delete"
      | "job.publish"
      | "job.unpublish"
      | "job.view"
    >
  ) => {
    return this.logRequest(action, `Job action: ${action}`);
  };

  /**
   * Logs application events
   */
  logApplicationAction = (
    action: Extract<
      AuditActionType,
      | "application.create"
      | "application.update"
      | "application.withdraw"
      | "application.status_change"
      | "application.view"
    >
  ) => {
    return this.logRequest(action, `Application action: ${action}`);
  };

  /**
   * Logs admin actions
   */
  logAdminAction = (
    action: Extract<
      AuditActionType,
      "admin.user_deactivate" | "admin.user_delete" | "admin.logs_view"
    >
  ) => {
    return this.logRequest(action, `Admin action: ${action}`);
  };

  /**
   * Error logging middleware
   * Should be used in error handlers
   */
  logError = async (req: Request, error: Error, statusCode: number = 500) => {
    try {
      await this.auditService.logFromRequest(req, "system.error", {
        severity: statusCode >= 500 ? "error" : "warning",
        success: "false",
        errorMessage: error.message,
        metadata: {
          statusCode,
          stack: error.stack,
        },
      });
    } catch (auditError) {
      console.error("Failed to log error to audit trail:", auditError);
    }
  };
}

// Export singleton instance
export const auditMiddleware = new AuditMiddleware();
