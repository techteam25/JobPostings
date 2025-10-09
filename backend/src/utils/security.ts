import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { env } from "@/config/env";
import { AppError, ErrorCode, UnauthorizedError } from "./errors";
import { TokenPayload } from "@/db/interfaces/auth";

export class SecurityUtils {
  private static readonly SALT_ROUNDS = 12;
  private static readonly TOKEN_LENGTH = 32;
  private static readonly accessTokenExpiry = "24h";
  private static readonly refreshTokenExpiry = "7d";

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString("hex");
  }

  static generateAccessToken(userId: number): string {
    return jwt.sign(
      {
        userId,
        iat: Date.now(),
      },
      env.JWT_SECRET,
      { expiresIn: this.accessTokenExpiry }, // Short-lived access token
    );
  }

  static generateRefreshToken(userId: number): string {
    return jwt.sign(
      {
        userId,
        iat: Date.now(),
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: this.refreshTokenExpiry }, // Longer-lived refresh token
    );
  }

  static verifyAccessToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          "Access token expired",
          401,
          ErrorCode.TOKEN_EXPIRED,
        );
      }
      throw error;
    }
  }

  static verifyRefreshToken(token: string): {
    userId: number;
    sessionId: number;
  } {
    try {
      const decoded = jwt.verify(
        token,
        env.JWT_REFRESH_SECRET || env.JWT_SECRET,
      ) as any;
      if (decoded.type !== "refresh") {
        throw new UnauthorizedError("Invalid token type");
      }
      return { userId: decoded.userId, sessionId: decoded.sessionId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          "Refresh token expired",
          401,
          ErrorCode.TOKEN_EXPIRED,
        );
      }
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>"'&]/g, "");
  }

  static isStrongPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
