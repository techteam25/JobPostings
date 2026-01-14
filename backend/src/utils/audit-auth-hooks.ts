import { AuditService } from "@/services/audit.service";
import logger from "@/logger";

const auditService = new AuditService();

/**
 * Helper function to extract IP address from Better-Auth request
 */
function getIpAddress(req: any): string {
  return (
    req?.headers?.["x-forwarded-for"]?.split(",")[0] ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    "unknown"
  );
}

/**
 * Add these hooks to your Better-Auth configuration
 */
export const authHooks = {
  /**
   * Hook for successful sign-in events
   */
  after: [
    {
      matcher: (context: any) => context.path === "/sign-in/email",
      handler: async (context: any) => {
        try {
          const { user, session } = context.data;
          
          if (user && session) {
            // Log successful login
            await auditService.logAuthEvent({
              userId: parseInt(user.id),
              userEmail: user.email,
              action: "auth.login",
              ipAddress: getIpAddress(context.request),
              userAgent: context.request?.headers?.["user-agent"],
              success: "true",
            });
          }
        } catch (error) {
          logger.error("Failed to log successful login:", error);
        }
      },
    },
    {
      matcher: (context: any) => context.path === "/sign-up/email",
      handler: async (context: any) => {
        try {
          const { user } = context.data;
          
          if (user) {
            // Log successful registration
            await auditService.logAuthEvent({
              userId: parseInt(user.id),
              userEmail: user.email,
              action: "auth.register",
              ipAddress: getIpAddress(context.request),
              userAgent: context.request?.headers?.["user-agent"],
              success: "true",
            });
          }
        } catch (error) {
          logger.error("Failed to log registration:", error);
        }
      },
    },
    {
      matcher: (context: any) => context.path === "/sign-out",
      handler: async (context: any) => {
        try {
          const { session } = context.data;
          
          if (session) {
            // Log logout
            await auditService.logAuthEvent({
              userId: parseInt(session.userId),
              userEmail: session.user?.email,
              action: "auth.logout",
              ipAddress: getIpAddress(context.request),
              userAgent: context.request?.headers?.["user-agent"],
              success: "true",
            });
          }
        } catch (error) {
          logger.error("Failed to log logout:", error);
        }
      },
    },
    {
      matcher: (context: any) => context.path === "/change-password",
      handler: async (context: any) => {
        try {
          const { user } = context.data;
          
          if (user) {
            // Log password change
            await auditService.logAuthEvent({
              userId: parseInt(user.id),
              userEmail: user.email,
              action: "auth.password_change",
              ipAddress: getIpAddress(context.request),
              userAgent: context.request?.headers?.["user-agent"],
              success: "true",
            });
          }
        } catch (error) {
          logger.error("Failed to log password change:", error);
        }
      },
    },
    {
      matcher: (context: any) => context.path === "/forget-password",
      handler: async (context: any) => {
        try {
          const { user } = context.data;
          
          if (user) {
            // Log password reset request
            await auditService.logAuthEvent({
              userId: parseInt(user.id),
              userEmail: user.email,
              action: "auth.password_reset",
              ipAddress: getIpAddress(context.request),
              userAgent: context.request?.headers?.["user-agent"],
              success: "true",
            });
          }
        } catch (error) {
          logger.error("Failed to log password reset:", error);
        }
      },
    },
    {
      matcher: (context: any) => context.path === "/verify-email",
      handler: async (context: any) => {
        try {
          const { user } = context.data;
          
          if (user) {
            // Log email verification
            await auditService.logAuthEvent({
              userId: parseInt(user.id),
              userEmail: user.email,
              action: "auth.email_verification",
              ipAddress: getIpAddress(context.request),
              userAgent: context.request?.headers?.["user-agent"],
              success: "true",
            });
          }
        } catch (error) {
          logger.error("Failed to log email verification:", error);
        }
      },
    },
  ],
  
  /**
   * Hook for failed authentication attempts
   */
  error: [
    {
      matcher: (context: any) => 
        context.path === "/sign-in/email" || 
        context.path === "/sign-up/email",
      handler: async (context: any) => {
        try {
          const email = context.request?.body?.email || "unknown";
          const action = context.path === "/sign-in/email" ? "auth.login" : "auth.register";
          
          // Log failed attempt
          await auditService.logAuthEvent({
            userEmail: email,
            action,
            ipAddress: getIpAddress(context.request),
            userAgent: context.request?.headers?.["user-agent"],
            success: "false",
            errorMessage: context.error?.message || "Authentication failed",
          });
        } catch (error) {
          logger.error("Failed to log failed auth attempt:", error);
        }
      },
    },
  ],
};
