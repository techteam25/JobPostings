import {
  EmailPreferenceAuditLog,
  InsertJobAlert,
  JobAlert,
} from "@/validations/jobAlerts.validation";
import { UserEmailPreferencesSchema } from "@/validations/user.validation";
import { PaginationMeta } from "@shared/types";
import { UnsentMatchesSchema } from "@/validations/job.validation";

export interface NotificationsRepositoryPort {
  findEmailPreferencesByUserId(
    userId: number,
  ): Promise<UserEmailPreferencesSchema | undefined>;
  findEmailPreferencesByToken(
    token: string,
  ): Promise<UserEmailPreferencesSchema | undefined>;
  createEmailPreferences(
    userId: number,
    unsubscribeToken: string,
  ): Promise<UserEmailPreferencesSchema | undefined>;
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
  ): Promise<UserEmailPreferencesSchema | undefined>;
  refreshUnsubscribeToken(
    userId: number,
    newToken: string,
  ): Promise<UserEmailPreferencesSchema | undefined>;
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
  ): Promise<boolean>;
  canCreateJobAlert(userId: number): Promise<{
    canCreate: boolean;
    currentCount: number;
    maxAllowed: number;
  }>;
  createJobAlert(
    userId: number,
    alertData: Omit<InsertJobAlert, "userId">,
  ): Promise<JobAlert>;
  getUserJobAlerts(
    userId: number,
    pagination: { page: number; limit: number },
  ): Promise<{ items: JobAlert[]; pagination: PaginationMeta }>;
  getJobAlertById(
    userId: number,
    alertId: number,
  ): Promise<JobAlert | undefined>;
  updateJobAlert(
    userId: number,
    alertId: number,
    updateData: Partial<Omit<InsertJobAlert, "userId" | "id">>,
  ): Promise<JobAlert | undefined>;
  deleteJobAlert(userId: number, alertId: number): Promise<void>;
  updateJobAlertPauseState(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ): Promise<JobAlert | undefined>;
  getAlertsForProcessing(
    frequency: "daily" | "weekly" | "monthly",
    cutoffTime: Date,
  ): Promise<JobAlert[]>;
  updateAlertLastSentAt(alertId: number, timestamp: Date): Promise<void>;
  saveAlertMatches(
    matches: Array<{
      jobAlertId: number;
      jobId: number;
      matchScore: number;
    }>,
  ): Promise<void>;
  getUnsentMatches(
    alertId: number,
    limit?: number,
  ): Promise<UnsentMatchesSchema[]>;
  markMatchesAsSent(matchIds: number[]): Promise<void>;
  getUnsentMatchCount(alertId: number): Promise<number>;
  pauseAlertsForInactiveUsers(): Promise<{
    alertsPaused: number;
    usersAffected: number;
  }>;
  logPreferenceChange(data: {
    userId: number;
    preferenceType: string;
    context: "job_seeker" | "employer" | "global";
    previousValue: boolean | null;
    newValue: boolean;
    changeSource: "account_settings" | "email_link";
    ipAddress?: string;
    userAgent?: string;
  }): Promise<number>;
  getUserAuditHistory(
    userId: number,
    limit?: number,
  ): Promise<EmailPreferenceAuditLog[]>;
  setEmployerEmailPreferences(
    userId: number,
  ): Promise<UserEmailPreferencesSchema | undefined>;
  unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ): Promise<UserEmailPreferencesSchema | undefined>;
  resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ): Promise<UserEmailPreferencesSchema | undefined>;
}
