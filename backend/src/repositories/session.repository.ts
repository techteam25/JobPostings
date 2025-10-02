import { eq, and, gt } from "drizzle-orm";
import {
  sessions,
  NewSession,
  UpdateSession,
  Session,
  users,
} from "../db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "../db/connection";
import { AppError, ErrorCode } from "../utils/errors";

export class SessionRepository extends BaseRepository<typeof sessions> {
  constructor() {
    super(sessions, "session");
  }

  async createSession(sessionData: NewSession): Promise<number> {
    return this.create(sessionData);
  }

  async findByAccessToken(
    accessToken: string,
    userId: number,
  ): Promise<Session | undefined> {
    try {
      const [result] = await db
        .select()
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, userId))
        .where(
          and(
            eq(sessions.accessToken, accessToken),
            eq(sessions.isActive, true),
            gt(sessions.expiresAt, new Date()),
          ),
        )
        .limit(1);

      return result?.sessions;
    } catch (error) {
      throw new AppError(
        "Failed to find session by access token",
        500,
        ErrorCode.DATABASE_ERROR,
        true,
        error,
      );
    }
  }

  async findByRefreshToken(refreshToken: string): Promise<any | null> {
    try {
      const [result] = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.refreshToken, refreshToken),
            eq(sessions.isActive, true),
            gt(sessions.refreshExpiresAt, new Date()),
          ),
        )
        .limit(1);

      return result;
    } catch (error) {
      throw new AppError(
        "Failed to find session by refresh token",
        500,
        ErrorCode.DATABASE_ERROR,
        true,
        error,
      );
    }
  }

  async updateSession(id: number, data: UpdateSession): Promise<boolean> {
    return this.update(id, data);
  }

  async deactivateSession(id: number): Promise<boolean> {
    return this.update(id, { isActive: false });
  }

  async deactivateAllUserSessions(userId: number): Promise<boolean> {
    try {
      await db
        .update(sessions)
        .set({ isActive: false })
        .where(eq(sessions.userId, userId));
      return true;
    } catch (error) {
      throw new AppError(
        "Failed to deactivate all user sessions",
        500,
        ErrorCode.DATABASE_ERROR,
        true,
        error,
      );
    }
  }
}
