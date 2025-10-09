import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { env } from "@/config/env";
import { AppError, ErrorCode, UnauthorizedError } from "./errors";
import { TokenPayload } from "@/db/interfaces/auth";
import sanitize from "sanitize-html";

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
  } {
    try {
      const { userId } = jwt.verify(
        token,
        env.JWT_REFRESH_SECRET,
      ) as TokenPayload;

      return { userId };
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
    return sanitize(input);
  }
}
