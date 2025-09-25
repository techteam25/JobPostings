import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserRepository } from "../repositories/user.repository";
import { SessionRepository } from "../repositories/session.repository";
import { BaseService } from "./base.service";
import { env } from "../config/env";
import { NewUser } from "../db/schema/users";
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  DatabaseError,
  NotFoundError,
} from "../utils/errors";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends Omit<NewUser, "passwordHash"> {
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
}

export class AuthService extends BaseService {
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;
  private readonly accessTokenExpiry = "24h";
  private readonly refreshTokenExpiry = "7d";

  constructor() {
    super();
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
  }

  async register(
    userData: RegisterData,
    userAgent?: string,
    ipAddress?: string
  ) {
    try {
      // Validate input
      this.validateInput(userData, [
        "email",
        "password",
        "firstName",
        "lastName",
        "role",
      ]);

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(
        userData.email
      );
      if (existingUser) {
        throw new ConflictError("User with this email already exists");
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const { password, ...userDataWithoutPassword } = userData;
      const userId = await this.userRepository.create({
        ...userDataWithoutPassword,
        passwordHash,
      });
      console.log("Created userId:", userId);
      if (!userId || isNaN(userId)) {
        throw new DatabaseError(`Invalid userId returned: ${userId}`);
      }

      // Create session and generate tokens
      const tokens = await this.createSession(
        userId,
        userAgent,
        ipAddress
      );

      // Get created user without password hash
      const user = await this.userRepository.findByIdWithProfile(
        userId
      );
      if (!user) {
        throw new DatabaseError("Failed to retrieve newly created user");
      }

      return {
        user: {
          id: user.users.id,
          email: user.users.email,
          firstName: user.users.firstName,
          lastName: user.users.lastName,
          role: user.users.role,
        },
        ...tokens,
      };
    } catch (error) {
      console.error("AuthService.register error:", error);
      this.handleError(error);
    }
  }

  async deleteUser(email: string) {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Delete user (sessions and auth records are deleted via ON DELETE CASCADE)
      await this.userRepository.deleteUser(user.id);

      return { message: "User deleted successfully" };
    } catch (error) {
      console.error("AuthService.deleteUser error:", error);
      this.handleError(error);
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new ValidationError("User not found");
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new ValidationError("Current password is incorrect");
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await this.userRepository.update(userId, { passwordHash: newHash });

      return { message: "Password changed successfully" };
    } catch (error) {
      this.handleError(error);
    }
  }

  async logout(accessToken: string) {
    try {
      const session =
        await this.sessionRepository.findByAccessToken(accessToken);
      if (session) {
        await this.sessionRepository.deactivateSession(session.id);
      }
      return { message: "Logout successful" };
    } catch (error) {
      this.handleError(error);
    }
  }

  async logoutAll(userId: number) {
    try {
      await this.sessionRepository.deactivateAllUserSessions(userId);
      return { message: "All sessions logged out" };
    } catch (error) {
      this.handleError(error);
    }
  }

  private async createSession(
    userId: number,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    if (!userId || isNaN(userId)) {
      throw new ValidationError(`Invalid userId: ${userId}`);
    }

    const tokens = this.generateTokens(userId);
    console.log("Generated tokens:", {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
    });

    await this.sessionRepository.createSession({
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userAgent,
      ipAddress,
      isActive: true,
      expiresAt: tokens.expiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });

    return tokens;
  }

  private generateTokens(userId: number): AuthTokens {
    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const accessToken = jwt.sign(
      { userId, type: "access", iat: Math.floor(Date.now() / 1000) },
      env.JWT_SECRET,
      { expiresIn: this.accessTokenExpiry }
    );

    const refreshToken = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    };
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  verifyToken(token: string): { userId: number } {
    try {
      if (!env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: number;
        type: string;
      };

      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      return { userId: decoded.userId };
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }

  async login(
    credentials: LoginCredentials,
    userAgent?: string,
    ipAddress?: string
  ) {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError("Invalid credentials");
      }

      if (!user.isActive) {
        throw new UnauthorizedError("Account is deactivated");
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid credentials");
      }

      // Update last login
      await this.userRepository.update(user.id, { lastLoginAt: new Date() });

      // Create session and generate tokens
      const tokens = await this.createSession(user.id, userAgent, ipAddress);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        ...tokens,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async refreshToken(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ) {
    try {
      if (!refreshToken) {
        throw new ValidationError("Refresh token is required");
      }

      // Find session by refresh token
      const session =
        await this.sessionRepository.findByRefreshToken(refreshToken);
      if (!session) {
        throw new UnauthorizedError("Invalid or expired refresh token");
      }

      // Verify user is still active
      const user = await this.userRepository.findById(session.userId);
      if (!user || !user.isActive) {
        await this.sessionRepository.deactivateSession(session.id);
        throw new UnauthorizedError("User account is inactive");
      }

      // Generate new tokens
      const tokens = this.generateTokens(session.userId);

      // Update session with new tokens
      await this.sessionRepository.updateSession(session.id, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        refreshExpiresAt: tokens.refreshExpiresAt,
        userAgent,
        ipAddress,
        lastUsedAt: new Date(),
      });

      return {
        user: {
          id: user.users.id,
          email: user.users.email,
          firstName: user.users.firstName,
          lastName: user.users.lastName,
          role: user.users.role,
        },
        ...tokens,
      };
    } catch (error) {
      this.handleError(error);
    }
  }
}