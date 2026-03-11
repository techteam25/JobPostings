import type {
  InsertJobAlert,
  JobAlert,
} from "@/validations/jobAlerts.validation";

export interface NotificationsRepositoryPort {
  findEmailPreferencesByUserId(userId: number): Promise<any>;
  findEmailPreferencesByToken(token: string): Promise<any>;
  createEmailPreferences(
    userId: number,
    unsubscribeToken: string,
  ): Promise<any>;
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
  ): Promise<any>;
  refreshUnsubscribeToken(userId: number, newToken: string): Promise<any>;
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
  ): Promise<any>;
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
  getUnsentMatches(alertId: number, limit?: number): Promise<any>;
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
  }): Promise<any>;
  getUserAuditHistory(userId: number, limit?: number): Promise<any>;
  setEmployerEmailPreferences(userId: number): Promise<any>;
  unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ): Promise<any>;
  resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ): Promise<any>;
}
