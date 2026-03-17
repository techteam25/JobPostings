import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { NotificationsServicePort } from "@/modules/notifications";
import type { NotificationsRepositoryPort } from "@/modules/notifications";
import type { EmailServicePort } from "@shared/ports/email-service.port";
import type { UserActivityQueryPort } from "@/modules/notifications";
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@shared/errors";
import type { PaginationMeta } from "@shared/types";
import type {
  CreateJobAlertInput,
  JobAlert,
  UpdateJobAlertInput,
} from "@/validations/jobAlerts.validation";
import crypto from "crypto";
import { env } from "@shared/config/env";

export class NotificationsService
  extends BaseService
  implements NotificationsServicePort
{
  constructor(
    private notificationsRepository: NotificationsRepositoryPort,
    private emailService: EmailServicePort,
    private userActivityQuery: Pick<
      UserActivityQueryPort,
      "getUserContactInfo"
    >,
  ) {
    super();
  }

  private generateUnsubscribeToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  async getEmailPreferences(userId: number) {
    try {
      const preferences =
        await this.notificationsRepository.findEmailPreferencesByUserId(userId);

      if (!preferences) {
        return fail(
          new NotFoundError("Email preferences not found for user", userId),
        );
      }

      return ok(preferences);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve email preferences"));
    }
  }

  async createDefaultEmailPreferences(userId: number) {
    try {
      const existingPreferences =
        await this.notificationsRepository.findEmailPreferencesByUserId(userId);

      if (existingPreferences) {
        return ok(existingPreferences);
      }

      const unsubscribeToken = this.generateUnsubscribeToken();
      const preferences =
        await this.notificationsRepository.createEmailPreferences(
          userId,
          unsubscribeToken,
        );

      if (!preferences) {
        return fail(new DatabaseError("Failed to create email preferences"));
      }

      return ok(preferences);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to create email preferences"));
    }
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
    try {
      const existingPreferences =
        await this.notificationsRepository.findEmailPreferencesByUserId(userId);

      if (!existingPreferences) {
        return fail(
          new NotFoundError("Email preferences not found for user", userId),
        );
      }

      const updatedPreferences =
        await this.notificationsRepository.updateEmailPreferences(
          userId,
          preferences,
        );

      if (!updatedPreferences) {
        return fail(new DatabaseError("Failed to update email preferences"));
      }

      return ok(updatedPreferences);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update email preferences"));
    }
  }

  async unsubscribeByToken(
    token: string,
    preferences?: Partial<{
      jobMatchNotifications: boolean;
      applicationStatusNotifications: boolean;
      savedJobUpdates: boolean;
      weeklyJobDigest: boolean;
      monthlyNewsletter: boolean;
      marketingEmails: boolean;
    }>,
  ) {
    try {
      const emailPreferences =
        await this.notificationsRepository.findEmailPreferencesByToken(token);

      if (!emailPreferences) {
        return fail(new NotFoundError("Invalid or expired unsubscribe token"));
      }

      if (
        emailPreferences.unsubscribeTokenExpiresAt &&
        new Date() > new Date(emailPreferences.unsubscribeTokenExpiresAt)
      ) {
        return fail(new ValidationError("Unsubscribe token has expired"));
      }

      const updateData = preferences || { globalUnsubscribe: true };

      const updatedPreferences =
        await this.notificationsRepository.updateEmailPreferences(
          emailPreferences.userId,
          updateData,
        );

      if (!updatedPreferences) {
        return fail(new DatabaseError("Failed to unsubscribe"));
      }

      return ok(updatedPreferences);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to unsubscribe"));
    }
  }

  async resubscribeEmailNotifications(userId: number) {
    try {
      const existingPreferences =
        await this.notificationsRepository.findEmailPreferencesByUserId(userId);

      if (!existingPreferences) {
        return fail(
          new NotFoundError("Email preferences not found for user", userId),
        );
      }

      const newToken = this.generateUnsubscribeToken();

      await this.notificationsRepository.refreshUnsubscribeToken(
        userId,
        newToken,
      );

      const updatedPreferences =
        await this.notificationsRepository.updateEmailPreferences(userId, {
          jobMatchNotifications: true,
          applicationStatusNotifications: true,
          savedJobUpdates: true,
          weeklyJobDigest: true,
          monthlyNewsletter: true,
          marketingEmails: true,
          globalUnsubscribe: false,
        });

      if (!updatedPreferences) {
        return fail(new DatabaseError("Failed to resubscribe"));
      }

      return ok(updatedPreferences);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to resubscribe"));
    }
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
  ) {
    try {
      const canSend = await this.notificationsRepository.canSendEmailType(
        userId,
        emailType,
      );
      return ok(canSend);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to check email preference"));
    }
  }

  async generateUnsubscribeLink(userId: number): Promise<string | null> {
    try {
      const preferences =
        await this.notificationsRepository.findEmailPreferencesByUserId(userId);

      if (!preferences) {
        return null;
      }

      return `${env.SERVER_URL}/api/users/me/email-preferences/unsubscribe/${preferences.unsubscribeToken}`;
    } catch {
      return null;
    }
  }

  async createJobAlert(userId: number, alertData: CreateJobAlertInput) {
    try {
      const canCreate =
        await this.notificationsRepository.canCreateJobAlert(userId);

      if (!canCreate.canCreate) {
        return fail(
          new ValidationError(
            `Maximum active job alerts reached. You have ${canCreate.currentCount} active alerts (limit: ${canCreate.maxAllowed}).`,
          ),
        );
      }

      const alert = await this.notificationsRepository.createJobAlert(
        userId,
        alertData,
      );

      if (!alert) {
        return fail(new DatabaseError("Failed to create job alert"));
      }

      return ok(alert);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to create job alert"));
    }
  }

  async getUserJobAlerts(userId: number, page: number, limit: number) {
    try {
      const result = await this.notificationsRepository.getUserJobAlerts(
        userId,
        { page, limit },
      );

      return ok({
        items: result.items,
        pagination: result.pagination as PaginationMeta,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve job alerts"));
    }
  }

  async getJobAlertById(userId: number, alertId: number) {
    try {
      const alert = await this.notificationsRepository.getJobAlertById(
        userId,
        alertId,
      );

      if (!alert) {
        return fail(new NotFoundError("Job alert", alertId));
      }

      return ok(alert);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve job alert"));
    }
  }

  async updateJobAlert(
    userId: number,
    alertId: number,
    updateData: UpdateJobAlertInput,
  ) {
    try {
      const existingAlert = await this.notificationsRepository.getJobAlertById(
        userId,
        alertId,
      );

      if (!existingAlert) {
        return fail(new NotFoundError("Job alert", alertId));
      }

      const dataWithSchedule = this.applyFrequencyChangeSchedule(
        existingAlert,
        updateData,
      );

      const merged = { ...existingAlert, ...dataWithSchedule };

      const hasSearchQuery =
        merged.searchQuery && merged.searchQuery.trim().length > 0;
      const hasLocation =
        (merged.city && merged.city.trim().length > 0) ||
        (merged.state && merged.state.trim().length > 0);
      const hasSkills = merged.skills && merged.skills.length > 0;
      const hasJobTypes = merged.jobType && merged.jobType.length > 0;
      const hasExperienceLevels =
        merged.experienceLevel && merged.experienceLevel.length > 0;

      const hasValidCriteria =
        hasSearchQuery ||
        hasLocation ||
        hasSkills ||
        hasJobTypes ||
        hasExperienceLevels;

      if (!hasValidCriteria) {
        return fail(
          new ValidationError(
            "Job alert must have at least one search criterion (search query, location, skills, job type, or experience level)",
          ),
        );
      }

      const updatedAlert = await this.notificationsRepository.updateJobAlert(
        userId,
        alertId,
        dataWithSchedule,
      );

      if (!updatedAlert) {
        return fail(new DatabaseError("Failed to update job alert"));
      }

      return ok(updatedAlert);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update job alert"));
    }
  }

  applyFrequencyChangeSchedule(
    existingAlert: JobAlert,
    updateData: UpdateJobAlertInput,
  ): UpdateJobAlertInput & { lastSentAt?: Date | null } {
    if (
      !updateData.frequency ||
      updateData.frequency === existingAlert.frequency
    ) {
      return updateData;
    }

    const now = new Date();
    const frequencyOrder = { daily: 0, weekly: 1, monthly: 2 } as const;
    const oldOrder = frequencyOrder[existingAlert.frequency];
    const newOrder = frequencyOrder[updateData.frequency];

    if (newOrder < oldOrder) {
      return { ...updateData, lastSentAt: null };
    }

    return { ...updateData, lastSentAt: now };
  }

  async deleteJobAlert(userId: number, alertId: number) {
    try {
      const existingAlert = await this.notificationsRepository.getJobAlertById(
        userId,
        alertId,
      );

      if (!existingAlert) {
        return fail(new NotFoundError("Job alert", alertId));
      }

      await this.notificationsRepository.deleteJobAlert(userId, alertId);

      return ok(null);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to delete job alert"));
    }
  }

  async togglePauseJobAlert(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ) {
    try {
      const existingAlert = await this.notificationsRepository.getJobAlertById(
        userId,
        alertId,
      );

      if (!existingAlert) {
        return fail(new NotFoundError("Job alert", alertId));
      }

      const updatedAlert =
        await this.notificationsRepository.updateJobAlertPauseState(
          userId,
          alertId,
          isPaused,
        );

      if (!updatedAlert) {
        return fail(
          new DatabaseError("Failed to update job alert pause state"),
        );
      }

      return ok(updatedAlert);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update job alert pause state"));
    }
  }

  async unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    changeSource: "account_settings" | "email_link",
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    try {
      const currentPrefs =
        await this.notificationsRepository.findEmailPreferencesByUserId(userId);

      if (!currentPrefs) {
        return fail(new NotFoundError("User preferences not found"));
      }

      const updated = await this.notificationsRepository.unsubscribeByContext(
        userId,
        context,
      );

      if (!updated) {
        return fail(new DatabaseError("Failed to unsubscribe"));
      }

      await this.notificationsRepository.logPreferenceChange({
        userId,
        preferenceType: `${context}_unsubscribe`,
        context,
        previousValue: false,
        newValue: true,
        changeSource,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });

      const user = await this.userActivityQuery.getUserContactInfo(userId);
      if (user) {
        await this.emailService.sendUnsubscribeConfirmation(
          user.email,
          user.fullName,
          context,
        );
      }

      return ok(updated);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to unsubscribe"));
    }
  }

  async findEmailPreferencesByToken(token: string) {
    try {
      const preferences =
        await this.notificationsRepository.findEmailPreferencesByToken(token);

      if (!preferences) {
        return fail(new NotFoundError("Email preferences not found for token"));
      }

      return ok(preferences);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve email preferences"));
    }
  }

  async resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    try {
      const currentPrefs =
        await this.notificationsRepository.findEmailPreferencesByUserId(userId);

      if (!currentPrefs) {
        return fail(new NotFoundError("User preferences not found"));
      }

      const updated = await this.notificationsRepository.resubscribeByContext(
        userId,
        context,
      );

      if (!updated) {
        return fail(new DatabaseError("Failed to resubscribe"));
      }

      await this.notificationsRepository.logPreferenceChange({
        userId,
        preferenceType: `${context}_resubscribe`,
        context,
        previousValue: true,
        newValue: false,
        changeSource: "account_settings",
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });

      return ok(updated);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to resubscribe"));
    }
  }

  async updateEmailPreferenceWithAudit(
    userId: number,
    preferenceType: string,
    newValue: boolean,
    context: "job_seeker" | "employer" | "global",
    changeSource: "account_settings" | "email_link",
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    try {
      const currentPrefs =
        await this.notificationsRepository.findEmailPreferencesByUserId(userId);

      if (!currentPrefs) {
        return fail(new NotFoundError("User preferences not found"));
      }

      const previousValue = currentPrefs[
        preferenceType as keyof typeof currentPrefs
      ] as boolean;

      const updateData = { [preferenceType]: newValue };
      const updated = await this.notificationsRepository.updateEmailPreferences(
        userId,
        updateData,
      );

      if (!updated) {
        return fail(new DatabaseError("Failed to update preference"));
      }

      await this.notificationsRepository.logPreferenceChange({
        userId,
        preferenceType,
        context,
        previousValue,
        newValue,
        changeSource,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });

      return ok(updated);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update preference"));
    }
  }

  async getUnsubscribeLandingPageData(token: string) {
    try {
      const prefsResult =
        await this.notificationsRepository.findEmailPreferencesByToken(token);

      if (!prefsResult) {
        return fail(new NotFoundError("Invalid or expired unsubscribe token"));
      }

      const userInfo = await this.userActivityQuery.getUserContactInfo(
        prefsResult.userId,
      );

      if (!userInfo) {
        return fail(new NotFoundError("User not found"));
      }

      return ok({
        user: {
          name: userInfo.fullName,
          email: userInfo.email,
        },
        preferences: prefsResult,
        token,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(
        new DatabaseError("Failed to retrieve unsubscribe landing page data"),
      );
    }
  }
}
