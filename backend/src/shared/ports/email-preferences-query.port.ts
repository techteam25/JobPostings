import type { UserEmailPreferencesSchema } from "@/validations/user.validation";

/**
 * Narrow port for email-sending code that needs to check user email preferences.
 *
 * EmailService uses this to decide whether a user has opted out of a specific
 * email type before dispatching. Implemented by NotificationsRepository.
 */
export interface EmailPreferencesQueryPort {
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

  findEmailPreferencesByUserId(
    userId: number,
  ): Promise<UserEmailPreferencesSchema | undefined>;
}
