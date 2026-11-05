import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type { PaginationMeta } from "@shared/types";
import type {
  CreateJobAlertInput,
  JobAlert,
  UpdateJobAlertInput,
} from "@/validations/jobAlerts.validation";
import { UserEmailPreferencesSchema } from "@/validations/user.validation";

export interface NotificationsServicePort {
  getEmailPreferences(
    userId: number,
  ): Promise<Result<UserEmailPreferencesSchema, AppError>>;

  createDefaultEmailPreferences(
    userId: number,
  ): Promise<Result<UserEmailPreferencesSchema, AppError>>;

  updateEmailPreferences(
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
  ): Promise<Result<UserEmailPreferencesSchema, AppError>>;

  unsubscribeByToken(
    token: string,
    preferences?: Partial<{
      jobMatchNotifications: boolean;
      applicationStatusNotifications: boolean;
      savedJobUpdates: boolean;
      weeklyJobDigest: boolean;
      monthlyNewsletter: boolean;
      marketingEmails: boolean;
    }>,
  ): Promise<Result<UserEmailPreferencesSchema, AppError>>;

  resubscribeEmailNotifications(
    userId: number,
  ): Promise<Result<UserEmailPreferencesSchema, AppError>>;

  canSendEmailType(
    userId: number,
    emailType:
      | "jobMatchNotifications"
      | "applicationStatusNotifications"
      | "savedJobUpdates"
      | "weeklyJobDigest"
      | "monthlyNewsletter"
      | "marketingEmails"
      | "accountSecurityAlerts",
  ): Promise<Result<boolean, AppError>>;

  generateUnsubscribeLink(userId: number): Promise<string | null>;

  createJobAlert(
    userId: number,
    alertData: CreateJobAlertInput,
  ): Promise<Result<JobAlert, AppError>>;

  getUserJobAlerts(
    userId: number,
    page: number,
    limit: number,
  ): Promise<
    Result<{ items: JobAlert[]; pagination: PaginationMeta }, AppError>
  >;

  getJobAlertById(
    userId: number,
    alertId: number,
  ): Promise<Result<JobAlert, AppError>>;

  updateJobAlert(
    userId: number,
    alertId: number,
    updateData: UpdateJobAlertInput,
  ): Promise<Result<JobAlert, AppError>>;

  applyFrequencyChangeSchedule(
    existingAlert: JobAlert,
    updateData: UpdateJobAlertInput,
  ): UpdateJobAlertInput & { lastSentAt?: Date | null };

  deleteJobAlert(
    userId: number,
    alertId: number,
  ): Promise<Result<null, AppError>>;

  togglePauseJobAlert(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ): Promise<Result<JobAlert, AppError>>;

  unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    changeSource: "account_settings" | "email_link",
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<Result<UserEmailPreferencesSchema, AppError>>;

  findEmailPreferencesByToken(
    token: string,
  ): Promise<Result<UserEmailPreferencesSchema, AppError>>;

  resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<Result<UserEmailPreferencesSchema, AppError>>;

  updateEmailPreferenceWithAudit(
    userId: number,
    preferenceType: string,
    newValue: boolean,
    context: "job_seeker" | "employer" | "global",
    changeSource: "account_settings" | "email_link",
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<Result<UserEmailPreferencesSchema, AppError>>;

  getUnsubscribeLandingPageData(token: string): Promise<
    Result<
      {
        user: { name: string; email: string };
        preferences: UserEmailPreferencesSchema;
        token: string;
      },
      AppError
    >
  >;
}
