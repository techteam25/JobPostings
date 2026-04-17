import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  lte,
  ne,
  or,
} from "drizzle-orm";
import {
  emailPreferenceAuditLog,
  jobAlertMatches,
  jobAlerts,
  user,
  userEmailPreferences,
} from "@/db/schema";
import type { NotificationsRepositoryPort } from "@/modules/notifications";
import { db } from "@shared/db/connection";
import { DatabaseError } from "@shared/errors";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import type {
  InsertJobAlert,
  JobAlert,
} from "@/validations/jobAlerts.validation";
import { UserEmailPreferencesSchema } from "@/validations/user.validation";

export class NotificationsRepository implements NotificationsRepositoryPort {
  async findEmailPreferencesByUserId(userId: number) {
    return await withDbErrorHandling(
      async () =>
        await db.query.userEmailPreferences.findFirst({
          where: eq(userEmailPreferences.userId, userId),
        }),
    );
  }

  async findEmailPreferencesByToken(token: string) {
    return await withDbErrorHandling(
      async () =>
        await db.query.userEmailPreferences.findFirst({
          where: eq(userEmailPreferences.unsubscribeToken, token),
        }),
    );
  }

  async createEmailPreferences(userId: number, unsubscribeToken: string) {
    return await withDbErrorHandling(async () => {
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

      const [result] = await db
        .insert(userEmailPreferences)
        .values({
          userId,
          unsubscribeToken,
          unsubscribeTokenExpiresAt: tokenExpiresAt,
          jobMatchNotifications: true,
          applicationStatusNotifications: true,
          savedJobUpdates: true,
          weeklyJobDigest: true,
          monthlyNewsletter: true,
          marketingEmails: true,
          accountSecurityAlerts: true,
          globalUnsubscribe: false,
        })
        .$returningId();

      if (!result || isNaN(result.id)) {
        throw new DatabaseError(
          `Failed to create email preferences for userId: ${userId}`,
        );
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  async updateEmailPreferences(
    userId: number,
    preferences: Partial<{
      jobMatchNotifications: boolean;
      applicationStatusNotifications: boolean;
      savedJobUpdates: boolean;
      weeklyJobDigest: boolean;
      monthlyNewsletter: boolean;
      marketingEmails: boolean;
      globalUnsubscribe: boolean;
    }>,
  ) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(userEmailPreferences)
        .set(preferences)
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to update email preferences for userId: ${userId}`,
        );
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  async refreshUnsubscribeToken(userId: number, newToken: string) {
    return await withDbErrorHandling(async () => {
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

      const [result] = await db
        .update(userEmailPreferences)
        .set({
          unsubscribeToken: newToken,
          tokenCreatedAt: new Date(),
          unsubscribeTokenExpiresAt: tokenExpiresAt,
        })
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to refresh unsubscribe token for userId: ${userId}`,
        );
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  async canSendEmailType(
    userId: number,
    emailType:
      | "jobMatchNotifications"
      | "applicationStatusNotifications"
      | "savedJobUpdates"
      | "weeklyJobDigest"
      | "monthlyNewsletter"
      | "marketingEmails"
      | "accountSecurityAlerts",
  ): Promise<boolean> {
    return await withDbErrorHandling(async () => {
      const preferences = await db.query.userEmailPreferences.findFirst({
        where: eq(userEmailPreferences.userId, userId),
      });

      if (!preferences) {
        return true;
      }

      if (preferences.globalUnsubscribe) {
        return emailType === "accountSecurityAlerts";
      }

      return preferences[emailType];
    });
  }

  async canCreateJobAlert(userId: number): Promise<{
    canCreate: boolean;
    currentCount: number;
    maxAllowed: number;
  }> {
    return await withDbErrorHandling(async () => {
      const result = await db
        .select({ count: count() })
        .from(jobAlerts)
        .where(and(eq(jobAlerts.userId, userId), eq(jobAlerts.isActive, true)));

      const currentCount = result[0]?.count ?? 0;
      const MAX_ALERTS_PER_USER = 10;

      return {
        canCreate: currentCount < MAX_ALERTS_PER_USER,
        currentCount,
        maxAllowed: MAX_ALERTS_PER_USER,
      };
    });
  }

  async createJobAlert(
    userId: number,
    alertData: Omit<InsertJobAlert, "userId">,
  ): Promise<JobAlert> {
    return await withDbErrorHandling(async () => {
      const [alert] = await db
        .insert(jobAlerts)
        .values({
          ...alertData,
          userId,
        })
        .$returningId();

      if (!alert || isNaN(alert.id)) {
        throw new DatabaseError(`Invalid insertId returned: ${alert?.id}`);
      }

      const createdAlert = await db.query.jobAlerts.findFirst({
        where: eq(jobAlerts.id, alert.id),
      });

      if (!createdAlert) {
        throw new DatabaseError("Failed to retrieve created job alert");
      }

      return createdAlert;
    });
  }

  async getUserJobAlerts(
    userId: number,
    pagination: { page: number; limit: number },
  ) {
    return await withDbErrorHandling(async () => {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const countResult = await db
        .select({ total: count() })
        .from(jobAlerts)
        .where(eq(jobAlerts.userId, userId));

      const total = countResult[0]?.total ?? 0;

      const alerts = await db.query.jobAlerts.findMany({
        where: eq(jobAlerts.userId, userId),
        limit,
        offset,
        orderBy: [desc(jobAlerts.createdAt)],
      });

      const totalPages = Math.ceil(total / limit);

      return {
        items: alerts,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    });
  }

  async getJobAlertById(
    userId: number,
    alertId: number,
  ): Promise<JobAlert | undefined> {
    return await withDbErrorHandling(async () => {
      return db.query.jobAlerts.findFirst({
        where: and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)),
      });
    });
  }

  async updateJobAlert(
    userId: number,
    alertId: number,
    updateData: Partial<Omit<InsertJobAlert, "userId" | "id">>,
  ): Promise<JobAlert | undefined> {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(jobAlerts)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to update job alert with id: ${alertId}`,
        );
      }

      return db.query.jobAlerts.findFirst({
        where: and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)),
      });
    });
  }

  async deleteJobAlert(userId: number, alertId: number): Promise<void> {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(jobAlerts)
        .where(and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to delete job alert with id: ${alertId}`,
        );
      }
    });
  }

  async updateJobAlertPauseState(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ): Promise<JobAlert | undefined> {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(jobAlerts)
        .set({
          isPaused,
          updatedAt: new Date(),
        })
        .where(and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to update pause state for job alert with id: ${alertId}`,
        );
      }

      return db.query.jobAlerts.findFirst({
        where: and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)),
      });
    });
  }

  async getAlertsForProcessing(
    frequency: "daily" | "weekly" | "monthly",
    cutoffTime: Date,
  ): Promise<JobAlert[]> {
    return await withDbErrorHandling(async () => {
      const activeUserIds = db
        .select({ id: user.id })
        .from(user)
        .where(ne(user.status, "deleted"));

      return db.query.jobAlerts.findMany({
        where: and(
          eq(jobAlerts.isActive, true),
          eq(jobAlerts.isPaused, false),
          eq(jobAlerts.frequency, frequency),
          or(
            isNull(jobAlerts.lastSentAt),
            lte(jobAlerts.lastSentAt, cutoffTime),
          ),
          inArray(jobAlerts.userId, activeUserIds),
        ),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: [asc(jobAlerts.lastSentAt)],
      });
    });
  }

  async updateAlertLastSentAt(alertId: number, timestamp: Date): Promise<void> {
    await withDbErrorHandling(async () => {
      await db
        .update(jobAlerts)
        .set({ lastSentAt: timestamp })
        .where(eq(jobAlerts.id, alertId));
    });
  }

  async saveAlertMatches(
    matches: Array<{
      jobAlertId: number;
      jobId: number;
      matchScore: number;
    }>,
  ): Promise<void> {
    if (matches.length === 0) return;

    await withDbErrorHandling(async () => {
      await db.insert(jobAlertMatches).values(
        matches.map((match) => ({
          ...match,
          wasSent: false,
        })),
      );
    });
  }

  async getUnsentMatches(alertId: number, limit: number = 10) {
    return await withDbErrorHandling(async () => {
      return db.query.jobAlertMatches.findMany({
        where: and(
          eq(jobAlertMatches.jobAlertId, alertId),
          eq(jobAlertMatches.wasSent, false),
        ),
        with: {
          job: {
            columns: {
              id: true,
              title: true,
              city: true,
              state: true,
              country: true,
              jobType: true,
              experience: true,
              description: true,
              createdAt: true,
            },
            with: {
              employer: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          desc(jobAlertMatches.matchScore),
          desc(jobAlertMatches.createdAt),
        ],
        limit,
      });
    });
  }

  async markMatchesAsSent(matchIds: number[]): Promise<void> {
    if (matchIds.length === 0) return;

    await withDbErrorHandling(async () => {
      await db
        .update(jobAlertMatches)
        .set({ wasSent: true })
        .where(inArray(jobAlertMatches.id, matchIds));
    });
  }

  async getUnsentMatchCount(alertId: number): Promise<number> {
    return await withDbErrorHandling(async () => {
      const result = await db
        .select({ count: count() })
        .from(jobAlertMatches)
        .where(
          and(
            eq(jobAlertMatches.jobAlertId, alertId),
            eq(jobAlertMatches.wasSent, false),
          ),
        );
      return result[0]?.count ?? 0;
    });
  }

  async pauseAlertsForUser(userId: number): Promise<number> {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(jobAlerts)
        .set({
          isPaused: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(jobAlerts.userId, userId),
            eq(jobAlerts.isActive, true),
            eq(jobAlerts.isPaused, false),
          ),
        );

      return result.affectedRows ?? 0;
    });
  }

  async pauseAlertsForInactiveUsers(inactiveUserIds: number[]): Promise<{
    alertsPaused: number;
    usersAffected: number;
  }> {
    return await withDbErrorHandling(async () => {
      if (inactiveUserIds.length === 0) {
        return { alertsPaused: 0, usersAffected: 0 };
      }

      await db
        .update(jobAlerts)
        .set({
          isPaused: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(jobAlerts.userId, inactiveUserIds),
            eq(jobAlerts.isActive, true),
            eq(jobAlerts.isPaused, false),
          ),
        );

      const alertsPausedResult = await db
        .select({ count: count() })
        .from(jobAlerts)
        .where(
          and(
            inArray(jobAlerts.userId, inactiveUserIds),
            eq(jobAlerts.isPaused, true),
          ),
        );

      const alertsPaused = alertsPausedResult[0]?.count ?? 0;

      return {
        alertsPaused,
        usersAffected: inactiveUserIds.length,
      };
    });
  }

  async logPreferenceChange(data: {
    userId: number;
    preferenceType: string;
    context: "job_seeker" | "employer" | "global";
    previousValue: boolean | null;
    newValue: boolean;
    changeSource: "account_settings" | "email_link";
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .insert(emailPreferenceAuditLog)
        .values(data)
        .$returningId();

      if (!result || isNaN(result.id)) {
        throw new DatabaseError("Failed to log preference change");
      }

      return result.id;
    });
  }

  async getUserAuditHistory(userId: number, limit = 50) {
    return await withDbErrorHandling(async () => {
      return db.query.emailPreferenceAuditLog.findMany({
        where: eq(emailPreferenceAuditLog.userId, userId),
        orderBy: desc(emailPreferenceAuditLog.changedAt),
        limit,
      });
    });
  }

  async setEmployerEmailPreferences(userId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(userEmailPreferences)
        .set({ matchedCandidates: true })
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows) {
        throw new DatabaseError(
          `Failed to set employer preferences for userId: ${userId}`,
        );
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  async unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ) {
    return await withDbErrorHandling(async () => {
      const updateData: Partial<UserEmailPreferencesSchema> = {};

      if (context === "global") {
        updateData.globalUnsubscribe = true;
      } else if (context === "job_seeker") {
        updateData.jobSeekerUnsubscribed = true;
        updateData.jobMatchNotifications = false;
        updateData.applicationStatusNotifications = false;
        updateData.savedJobUpdates = false;
        updateData.weeklyJobDigest = false;
      } else if (context === "employer") {
        updateData.employerUnsubscribed = true;
        updateData.matchedCandidates = false;
      }

      const [result] = await db
        .update(userEmailPreferences)
        .set(updateData)
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows) {
        throw new DatabaseError(`Failed to unsubscribe for userId: ${userId}`);
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  async resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ) {
    return await withDbErrorHandling(async () => {
      const updateData: Partial<UserEmailPreferencesSchema> = {};

      if (context === "global") {
        updateData.globalUnsubscribe = false;
      } else if (context === "job_seeker") {
        updateData.jobSeekerUnsubscribed = false;
        updateData.jobMatchNotifications = true;
        updateData.applicationStatusNotifications = true;
        updateData.savedJobUpdates = true;
        updateData.weeklyJobDigest = true;
      } else if (context === "employer") {
        updateData.employerUnsubscribed = false;
        updateData.matchedCandidates = true;
      }

      const [result] = await db
        .update(userEmailPreferences)
        .set(updateData)
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows) {
        throw new DatabaseError(`Failed to resubscribe for userId: ${userId}`);
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }
}
