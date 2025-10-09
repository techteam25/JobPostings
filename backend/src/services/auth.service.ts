import jwt from "jsonwebtoken";

import { BaseService } from "./base.service";
import { ChangePasswordData, EmailData } from "@/db/interfaces/common";
import { env } from "@/config/env";
import { SessionRepository } from "@/repositories/session.repository";
import { Session, User } from "@/db/schema";
import { TokenPayload } from "@/db/interfaces/auth";
import { UserRepository } from "@/repositories/user.repository";
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  DatabaseError,
  NotFoundError,
} from "@/utils/errors";
import {
  RegisterUserSchema,
  UserLoginSchema,
} from "@/validations/auth.validation";
import { AuthTokens } from "@/types";
import { SecurityUtils } from "@/utils/security";

export class AuthService extends BaseService {
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;

  constructor() {
    super();
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
  }

  async register(
    userData: RegisterUserSchema["body"],
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      return this.handleError(
        new ConflictError("User with this email already exists"),
      );
    }

    // Hash password
    const passwordHash = await SecurityUtils.hashPassword(userData.password);

    // Create user
    const { password, ...userDataWithoutPassword } = userData;
    const userId = await this.userRepository.createUser({
      ...userDataWithoutPassword,
      passwordHash,
    });
    if (!userId || isNaN(userId)) {
      return this.handleError(
        new DatabaseError(`Invalid userId returned: ${userId}`),
      );
    }

    // Create session and generate tokens
    const [tokens, user] = await Promise.all([
      this.createSession(userId, userAgent, ipAddress),
      this.userRepository.findUserById(userId),
    ]);

    if (!user) {
      return this.handleError(
        new DatabaseError(
          `Failed to retrieve newly created user with ID ${userId}`,
        ),
      );
    }

    return { user, tokens };
  }

  async deleteUser({ email }: EmailData): Promise<boolean> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return this.handleError(new NotFoundError("User not found"));
    }

    // Delete user (sessions and auth records are deleted via ON DELETE CASCADE)
    await this.userRepository.deleteUser(user.id);

    return true;
  }

  async changePassword(
    userId: number,
    { currentPassword, newPassword }: ChangePasswordData,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return this.handleError(new NotFoundError("User not found"));
    }

    const isValid = await SecurityUtils.verifyPassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      return this.handleError(
        new ValidationError("Current password is incorrect"),
      );
    }

    const newHash = await SecurityUtils.hashPassword(newPassword);
    await this.userRepository.update(userId, { passwordHash: newHash });
  }

  async forgotPassword({ email }: EmailData): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return this.handleError(new NotFoundError("User not found"));
    }

    // Generate reset token
    const resetToken = SecurityUtils.generateSecureToken();
    // TODO: Implement token storage and email sending logic
    // For example, store resetToken in a password_resets table and send email
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword({ token, newPassword }: any): Promise<void> {
    // TODO: Verify reset token (e.g., check against a password_resets table)
    // For now, assume token is valid and associated with a userId
    const userId = await this.validateResetToken(token);
    if (!userId) {
      return this.handleError(
        new UnauthorizedError("Invalid or expired reset token"),
      );
    }

    const newHash = await SecurityUtils.hashPassword(newPassword);
    await this.userRepository.update(userId, { passwordHash: newHash });
  }

  async login(
    credentials: UserLoginSchema["body"],
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ tokens: AuthTokens }> {
    const { email, password } = credentials;

    // Find user by email (include passwordHash for verification)
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is deactivated");
    }

    // Verify password
    const isPasswordValid = await SecurityUtils.verifyPassword(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Update last login
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    // Create session and generate tokens
    const tokens = await this.createSession(user.id, userAgent, ipAddress);

    return { tokens };
  }

  async refreshToken(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<Session> {
    if (!refreshToken) {
      return this.handleError(new ValidationError("Refresh token is required"));
    }

    // Find session by refresh token
    const session =
      await this.sessionRepository.findByRefreshToken(refreshToken);
    if (!session) {
      return this.handleError(
        new UnauthorizedError("Invalid or expired refresh token"),
      );
    }

    // Verify user is still active
    const userResult = await this.userRepository.findByIdWithProfile(
      session.userId,
    );
    if (!userResult || !userResult.isActive) {
      await this.sessionRepository.deactivateSession(session.id);
      return this.handleError(
        new UnauthorizedError("User account is inactive"),
      );
    }

    // Generate new tokens
    const tokens = this.generateTokens(session.userId);

    // Update session with new tokens
    await this.sessionRepository.updateSession(session.id, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
      lastUsedAt: new Date(),
    });

    return {
      id: session.id,
      userId: session.userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
      isActive: true,
      expiresAt: tokens.expiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
      createdAt: session.createdAt,
      lastUsedAt: new Date(),
    };
  }

  private async createSession(
    userId: number,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    if (!userId || isNaN(userId)) {
      return this.handleError(new ValidationError(`Invalid userId: ${userId}`));
    }

    const tokens = this.generateTokens(userId);

    await this.sessionRepository.createSession({
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
      isActive: true,
      expiresAt: tokens.expiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });

    return tokens;
  }

  private generateTokens(userId: number): AuthTokens {
    const accessToken = SecurityUtils.generateAccessToken(userId);

    const refreshToken = SecurityUtils.generateRefreshToken(userId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    };
  }

  verifyToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    return {
      userId: decoded.userId,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  }

  private async validateResetToken(token: string): Promise<number> {
    // TODO: Implement token validation logic (e.g., check against a password_resets table)
    // For now, return a dummy userId (replace with actual implementation)
    throw new Error("validateResetToken not implemented");
  }
}
