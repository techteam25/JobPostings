import type { BaseRepositoryPort } from "./base-repository.port";
import type { user } from "@/db/schema";
import type {
  NewUserProfile,
  UpdateUserProfile,
  User,
  UserProfile,
  UserWithProfile,
} from "@/validations/userProfile.validation";
import {
  EmailPreferenceAuditLog,
  InsertJobAlert,
  JobAlert,
} from "@/validations/jobAlerts.validation";
import {
  SavedJobs,
  UserEmailPreferencesSchema,
} from "@/validations/user.validation";
import { PaginationMeta } from "@shared/types";
import { UnsentMatchesSchema } from "@/validations/job.validation";

type UserSelect = typeof user.$inferSelect;
type UserInsert = typeof user.$inferInsert;

export interface UserRepositoryPort extends BaseRepositoryPort<
  UserSelect,
  UserInsert
> {
  /**
   * Finds a user by their email address, excluding deleted users.
   */
  findByEmail(email: string): Promise<User | undefined>;

  /**
   * Finds a user by their ID, including profile information with related data.
   */
  findByIdWithProfile(id: number): Promise<UserWithProfile | undefined>;

  /**
   * Retrieves the profile completion status for a user.
   */
  getUserProfileStatus(userId: number): Promise<{ complete: boolean }>;

  /**
   * Finds a user by their ID, including password information.
   */
  findByIdWithPassword(id: number): Promise<User | undefined>;

  /**
   * Finds a user by their ID without profile information.
   */
  findUserById(id: number): Promise<User | undefined>;

  /**
   * Creates a user profile for an existing user.
   */
  createProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ): Promise<UserWithProfile["profile"] | undefined>;

  /**
   * Updates a user's profile, including education, work experiences, and certifications.
   */
  updateProfile(
    userId: number,
    profileData: UpdateUserProfile,
  ): Promise<UserWithProfile | undefined>;

  /**
   * Searches users by name or email with pagination.
   */
  searchUsers(
    searchTerm: string,
    options?: { page?: number; limit?: number },
  ): Promise<{
    items: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  /**
   * Finds all active users including their profiles.
   */
  findActiveUsersIncludingProfile(): Promise<UserWithProfile[] | undefined>;

  /**
   * Deactivates or activates a user account.
   */
  deactivateUserAccount(
    id: number,
    data: { status: "active" | "deactivated" | "deleted" },
  ): Promise<User | undefined>;

  /**
   * Checks if a user can seek jobs by verifying if they have a profile.
   */
  canSeekJobs(userId: number): Promise<boolean>;

  /**
   * Retrieves saved jobs for a user with pagination.
   */
  getSavedJobsForUser(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{ items: SavedJobs[]; pagination: PaginationMeta }>;

  /**
   * Saves a job for a user, with a limit of 50 saved jobs.
   */
  saveJobForUser(userId: number, jobId: number): Promise<{ success: boolean }>;

  /**
   * Checks if a job is saved by a user.
   */
  isJobSavedByUser(userId: number, jobId: number): Promise<boolean>;

  /**
   * Unsaves a job for a user.
   */
  unsaveJobForUser(
    userId: number,
    jobId: number,
  ): Promise<{ success: boolean }>;

  /**
   * Retrieves the onboarding intent for a user.
   */
  getUserIntent(userId: number): Promise<
    | {
        status: "completed" | "pending";
        intent: "employer" | "seeker";
      }
    | undefined
  >;

  /**
   * Updates the profile visibility for a user.
   */
  updateProfileVisibility(
    userId: number,
    isPublic: boolean,
  ): Promise<UserProfile | undefined>;

  /**
   * Finds email preferences by user ID.
   */
  findEmailPreferencesByUserId(
    userId: number,
  ): Promise<UserEmailPreferencesSchema | undefined>;

  /**
   * Finds email preferences by unsubscribe token.
   */
  findEmailPreferencesByToken(
    token: string,
  ): Promise<UserEmailPreferencesSchema | undefined>;

  /**
   * Creates default email preferences for a user.
   */
  createEmailPreferences(
    userId: number,
    unsubscribeToken: string,
  ): Promise<UserEmailPreferencesSchema | undefined>;

  /**
   * Updates email preferences for a user.
   */
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

  /**
   * Generates and updates a new unsubscribe token for a user.
   */
  refreshUnsubscribeToken(
    userId: number,
    newToken: string,
  ): Promise<UserEmailPreferencesSchema | undefined>;

  /**
   * Checks if a user can receive a specific type of email based on preferences.
   */
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

  /**
   * Checks if a user can create more job alerts.
   */
  canCreateJobAlert(userId: number): Promise<{
    canCreate: boolean;
    currentCount: number;
    maxAllowed: number;
  }>;

  /**
   * Creates a new job alert for a user.
   */
  createJobAlert(
    userId: number,
    alertData: Omit<InsertJobAlert, "userId">,
  ): Promise<JobAlert>;

  /**
   * Retrieves all job alerts for a user with pagination.
   */
  getUserJobAlerts(
    userId: number,
    pagination: { page: number; limit: number },
  ): Promise<{ items: JobAlert[]; pagination: PaginationMeta }>;

  /**
   * Retrieves a specific job alert by ID for a user.
   */
  getJobAlertById(
    userId: number,
    alertId: number,
  ): Promise<JobAlert | undefined>;

  /**
   * Updates a job alert for a user.
   */
  updateJobAlert(
    userId: number,
    alertId: number,
    updateData: Partial<Omit<InsertJobAlert, "userId" | "id">>,
  ): Promise<JobAlert | undefined>;

  /**
   * Deletes a job alert for a user.
   */
  deleteJobAlert(userId: number, alertId: number): Promise<void>;

  /**
   * Updates the pause state of a job alert.
   */
  updateJobAlertPauseState(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ): Promise<JobAlert | undefined>;

  /**
   * Retrieves active job alerts that are due for processing based on frequency.
   */
  getAlertsForProcessing(
    frequency: "daily" | "weekly" | "monthly",
    cutoffTime: Date,
  ): Promise<JobAlert[]>;

  /**
   * Updates the lastSentAt timestamp for a job alert.
   */
  updateAlertLastSentAt(alertId: number, timestamp: Date): Promise<void>;

  /**
   * Saves job matches for a job alert.
   */
  saveAlertMatches(
    matches: Array<{
      jobAlertId: number;
      jobId: number;
      matchScore: number;
    }>,
  ): Promise<void>;

  /**
   * Retrieves unsent matches for a job alert.
   */
  getUnsentMatches(
    alertId: number,
    limit?: number,
  ): Promise<UnsentMatchesSchema[]>;

  /**
   * Marks job alert matches as sent.
   */
  markMatchesAsSent(matchIds: number[]): Promise<void>;

  /**
   * Gets the count of unsent matches for a job alert.
   */
  getUnsentMatchCount(alertId: number): Promise<number>;

  /**
   * Pauses job alerts for inactive users by their IDs.
   */
  pauseAlertsForInactiveUsers(inactiveUserIds: number[]): Promise<{
    alertsPaused: number;
    usersAffected: number;
  }>;

  /**
   * Logs an email preference change to the audit log.
   */
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

  /**
   * Gets audit history for a user's email preferences.
   */
  getUserAuditHistory(
    userId: number,
    limit?: number,
  ): Promise<EmailPreferenceAuditLog[]>;

  /**
   * Set default employer email preferences when user joins organization.
   */
  setEmployerEmailPreferences(
    userId: number,
  ): Promise<UserEmailPreferencesSchema | undefined>;

  /**
   * Unsubscribe from specific context (job_seeker/employer/global).
   */
  unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ): Promise<UserEmailPreferencesSchema | undefined>;

  /**
   * Re-subscribe to specific context (job_seeker/employer/global).
   */
  resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ): Promise<UserEmailPreferencesSchema | undefined>;
}
