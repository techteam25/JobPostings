import { Request, Response } from "express";
import {
  AuthService,
  LoginCredentials,
  RegisterData,
} from "../services/auth.service";
import { SessionRepository } from "../repositories/session.repository";
import { BaseController } from "./base.controller";
import { and, eq } from "drizzle-orm";
import { sessions } from "../db/schema/sessions";
import { AppError, ErrorCode } from "../utils/errors";

// Extend Request to include sanitizedBody
interface AuthRequest extends Request {
  userId?: number;
  sessionId?: number;
  user?: any;
  sanitizedBody?: any;
}

export class AuthController extends BaseController {
  private authService: AuthService;
  private sessionRepository: SessionRepository;

  constructor() {
    super();
    this.authService = new AuthService();
    this.sessionRepository = new SessionRepository();
  }

  register = async (req: AuthRequest, res: Response) => {
    try {
      const userData: RegisterData = req.sanitizedBody ?? req.body; // Use sanitizedBody if available
      const userAgent = req.headers["user-agent"] ?? "";
      const ipAddress = req.ip ?? req.connection.remoteAddress ?? "";
      
      const result = await this.authService.register(userData, userAgent, ipAddress);
      this.sendSuccess(res, result, "User registered successfully", 201);
    } catch (error) {
      this.handleControllerError(res, error, "Registration failed", 400);
    }
  };

  login = async (req: AuthRequest, res: Response) => {
    try {
      const credentials: LoginCredentials = req.sanitizedBody ?? req.body;
      const userAgent = req.headers["user-agent"] ?? "";
      const ipAddress = req.ip ?? req.connection.remoteAddress ?? "";
      
      const result = await this.authService.login(credentials, userAgent, ipAddress);
      this.sendSuccess(res, result, "Login successful");
    } catch (error) {
      this.handleControllerError(res, error, "Login failed", 401);
    }
  };

  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", 401, ErrorCode.UNAUTHORIZED);
      }
      const { currentPassword, newPassword } = req.sanitizedBody ?? req.body;
      
      await this.authService.changePassword(req.userId, currentPassword, newPassword);
      this.sendSuccess(res, null, "Password changed successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Password change failed", 400);
    }
  };

  refreshToken = async (req: AuthRequest, res: Response) => {
    try {
      const { refreshToken } = req.sanitizedBody ?? req.body;
      const userAgent = req.headers["user-agent"] ?? "";
      const ipAddress = req.ip ?? req.connection.remoteAddress ?? "";
      
      const session = await this.authService.refreshToken(refreshToken, userAgent, ipAddress);
      this.sendSuccess(res, session, "Token refreshed successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Token refresh failed", 401);
    }
  };

  logout = async (req: AuthRequest, res: Response) => {
    try {
      const token = req.headers.authorization?.substring(7);
      if (token) {
        const session = await this.sessionRepository.findByAccessToken(token);
        if (session) {
          await this.sessionRepository.deactivateSession(session.id);
        }
      }
      this.sendSuccess(res, null, "Logout successful");
    } catch (error) {
      this.handleControllerError(res, error, "Logout failed", 500);
    }
  };

  logoutAll = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", 401, ErrorCode.UNAUTHORIZED);
      }
      const condition = and(
        eq(sessions.userId, req.userId),
        eq(sessions.isActive, true)
      );

      if (condition) {
        await this.sessionRepository.updateMany(
          condition,
          { isActive: false }
        );
      }
      this.sendSuccess(res, null, "All sessions logged out");
    } catch (error) {
      this.handleControllerError(res, error, "Logout failed", 500);
    }
  };

  getProfile = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError("User not found in request", 404, ErrorCode.NOT_FOUND);
      }
      this.sendSuccess(res, req.user, "Profile retrieved successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Failed to retrieve profile", 500);
    }
  };
}