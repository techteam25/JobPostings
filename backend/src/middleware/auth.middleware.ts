import { NextFunction, Request, Response } from "express";
import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";
import logger from "@/logger";

export class AuthMiddleware {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.header(
          "WWW-Authenticate",
          `Bearer realm=${req.originalUrl} charset="UTF-8"`,
        );

        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      const token = authHeader.substring(7);
      const decoded = this.authService.verifyToken(token);

      req.user = await this.userService.getUserById(decoded.userId);
      req.userId = decoded.userId;
      req.sessionId = decoded.sessionId; // Assign sessionId if present in token

      return next();
    } catch (error) {
      logger.error(error);
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }
  };

  requireRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userId) {
          return res.status(401).json({
            status: "error",
            message: "Authentication required",
          });
        }

        // Fetch user to check role
        const userService = new UserService();
        const user = await userService.getUserById(req.userId);

        if (!roles.includes(user.role)) {
          return res.status(403).json({
            status: "error",
            message: "Insufficient permissions",
          });
        }

        req.user = user;
        return next();
      } catch (error) {
        return res.status(500).json({
          status: "error",
          message: "Error checking user permissions",
        });
      }
    };
  };

  requireActiveUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user || !req.user.isActive) {
      return res.status(403).json({
        status: "error",
        message: "User account is not active",
      });
    }
    return next();
  };
}
