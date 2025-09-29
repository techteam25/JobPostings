import { Response } from "express";
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
import { SafeUser, UpdateUserProfile } from "../db/schema/users";
import { ChangePasswordData, EmailData } from "../db/interfaces/common";
import { AuthRequest, AuthSession,  RefreshTokenData, ResetPasswordData } from "../db/interfaces/auth";

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
      const userData: RegisterData = req.sanitizedBody ?? req.body;
      const userAgent = req.headers["user-agent"] ?? "";
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? "";
      
      const result = await this.authService.register(userData, userAgent, ipAddress);
      this.sendSuccess(res, { user: result.user, ...result.tokens }, "User registered successfully", 201);
    } catch (error) {
      this.handleControllerError(res, error, "Registration failed", 400);
    }
  };

  login = async (req: AuthRequest, res: Response) => {
    try {
      const credentials: LoginCredentials = req.sanitizedBody ?? req.body;
      const userAgent = req.headers["user-agent"] ?? "";
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? "";
      
      const result = await this.authService.login(credentials, userAgent, ipAddress);
      this.sendSuccess(res, { user: result.user, ...result.tokens }, "Login successful");
    } catch (error) {
      this.handleControllerError(res, error, "Login failed", 401);
    }
  };

  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        throw new AppError("User not authenticated", 401, ErrorCode.UNAUTHORIZED);
      }
      const { currentPassword, newPassword }: ChangePasswordData = req.sanitizedBody ?? req.body;
      
      await this.authService.changePassword(req.userId, { currentPassword, newPassword });
      this.sendSuccess(res, null, "Password changed successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Password change failed", 400);
    }
  };

  refreshToken = async (req: AuthRequest, res: Response) => {
    try {
      const { refreshToken }: RefreshTokenData = req.sanitizedBody ?? req.body;
      const userAgent = req.headers["user-agent"] ?? "";
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? "";
      
      const session: AuthSession = await this.authService.refreshToken(refreshToken, userAgent, ipAddress);
      this.sendSuccess(res, session, "Token refreshed successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Token refresh failed", 401);
    }
  };

  logout = async (req: AuthRequest, res: Response) => {
    try {
      const token = req.headers.authorization?.substring(7);
      if (token) {
        const session: AuthSession | null = await this.sessionRepository.findByAccessToken(token);
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

      await this.sessionRepository.updateMany(
        condition!,
        { isActive: false }
      );
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

  forgotPassword = async (req: AuthRequest, res: Response) => {
    try {
      const { email }: EmailData = req.sanitizedBody ?? req.body;
      await this.authService.forgotPassword({ email });
      this.sendSuccess(res, null, "Password reset email sent");
    } catch (error) {
      this.handleControllerError(res, error, "Failed to send password reset email", 400);
    }
  };

  resetPassword = async (req: AuthRequest, res: Response) => {
    try {
      const { token, newPassword }: ResetPasswordData = req.sanitizedBody ?? req.body;
      await this.authService.resetPassword({ token, newPassword });
      this.sendSuccess(res, null, "Password reset successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Failed to reset password", 400);
    }
  };
}