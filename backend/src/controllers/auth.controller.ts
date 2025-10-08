import { Request, Response } from "express";
import { AuthService } from "@/services/auth.service";
import { SessionRepository } from "@/repositories/session.repository";
import { BaseController } from "./base.controller";
import { AppError, ErrorCode } from "@/utils/errors";
import { ResetPasswordData } from "@/db/interfaces/auth";
import {
  ChangeUserPasswordSchema,
  RegisterUserSchema,
  UserLoginSchema,
  UserRefreshTokenSchema,
} from "@/validations/auth.validation";

export class AuthController extends BaseController {
  private authService: AuthService;
  private sessionRepository: SessionRepository;

  constructor() {
    super();
    this.authService = new AuthService();
    this.sessionRepository = new SessionRepository();
  }

  register = async (
    req: Request<{}, {}, RegisterUserSchema["body"]>,
    res: Response,
  ) => {
    try {
      const userData = req.body;
      const userAgent = req.headers["user-agent"] ?? "";
      const ipAddress = req.ip ?? "";

      const result = await this.authService.register(
        userData,
        userAgent,
        ipAddress,
      );
      this.sendSuccess(
        res,
        { user: result.user, ...result.tokens },
        "User registered successfully",
        201,
      );
    } catch (error) {
      this.handleControllerError(res, error, "Registration failed", 400);
    }
  };

  login = async (
    req: Request<{}, {}, UserLoginSchema["body"]>,
    res: Response,
  ) => {
    try {
      const credentials = req.body;
      const userAgent = req.headers["user-agent"] ?? "";
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? "";

      const { tokens } = await this.authService.login(
        credentials,
        userAgent,
        ipAddress,
      );
      this.sendSuccess(res, tokens, "Login successful");
    } catch (error) {
      this.handleControllerError(res, error, "Login failed", 401);
    }
  };

  changePassword = async (
    req: Request<{}, {}, ChangeUserPasswordSchema["body"]>,
    res: Response,
  ) => {
    if (!req.userId) {
      return this.handleControllerError(
        res,
        new AppError("User not authenticated", 401, ErrorCode.UNAUTHORIZED),
      );
    }
    const { currentPassword, newPassword } = req.body;

    await this.authService.changePassword(req.userId, {
      currentPassword,
      newPassword,
    });
    return this.sendSuccess(res, null, "Password changed successfully");
  };

  refreshToken = async (
    req: Request<{}, {}, UserRefreshTokenSchema["body"]>,
    res: Response,
  ) => {
    try {
      const { refreshToken } = req.body;
      const userAgent = req.headers["user-agent"] ?? "";
      const ipAddress = req.ip ?? "";

      const session = await this.authService.refreshToken(
        refreshToken,
        userAgent,
        ipAddress,
      );
      return this.sendSuccess(res, session, "Token refreshed successfully");
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Token refresh failed",
        401,
      );
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.substring(7);
      if (token) {
        const session = await this.sessionRepository.findByAccessToken(
          token,
          req.userId!,
        );
        if (session) {
          await this.sessionRepository.deactivateSession(session.id);
        }
      }
      this.sendSuccess(res, null, "Logout successful");
    } catch (error) {
      this.handleControllerError(res, error, "Logout failed", 500);
    }
  };

  // logoutAll = async (req: AuthRequest, res: Response) => {
  //   try {
  //     if (!req.userId) {
  //       throw new AppError(
  //         "User not authenticated",
  //         401,
  //         ErrorCode.UNAUTHORIZED,
  //       );
  //     }
  //     const condition = and(  <--- // This should be in the repository
  //       eq(sessions.userId, req.userId),
  //       eq(sessions.isActive, true),
  //     );
  //
  //     await this.sessionRepository.updateMany(condition!, { isActive: false }); <--- // This should be in the repository
  //     this.sendSuccess(res, null, "All sessions logged out");
  //   } catch (error) {
  //     this.handleControllerError(res, error, "Logout failed", 500);
  //   }
  // };

  getProfile = async (req: Request, res: Response) => {
    if (!req.user) {
      return this.handleControllerError(
        res,
        new AppError("User not found in request", 404, ErrorCode.NOT_FOUND),
      );
    }
    return this.sendSuccess(res, req.user, "Profile retrieved successfully");
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword({ email });
      this.sendSuccess(res, null, "Password reset email sent");
    } catch (error) {
      this.handleControllerError(
        res,
        error,
        "Failed to send password reset email",
        400,
      );
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword }: ResetPasswordData = req.body;
      await this.authService.resetPassword({ token, newPassword });
      this.sendSuccess(res, null, "Password reset successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Failed to reset password", 400);
    }
  };
}
