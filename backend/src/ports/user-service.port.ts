import {
  NewUserProfile,
  UpdateUser,
  UpdateUserProfile,
  User,
  type UserProfile,
  type UserWithProfile,
} from "@/validations/userProfile.validation";
import type {
  CreateJobAlertInput,
  JobAlert,
  UpdateJobAlertInput,
} from "@/validations/jobAlerts.validation";
import type { Result } from "@shared/result";
import {
  SavedJobs,
  UserEmailPreferencesSchema,
} from "@/validations/user.validation";
import type { AppError } from "@shared/errors";
import type { PaginationMeta } from "@shared/types";
import { BetterAuthSuccessResponseSchema } from "@/validations/auth.validation";

/**
 * Port interface for UserService.
 * Defines the public contract for user-related operations.
 */
export interface UserServicePort {
  getAllUsers(
    searchTerm: string | undefined,
    page: number,
    limit: number,
  ): Promise<Result<{ items: User[]; pagination: PaginationMeta }, AppError>>;

  getUserById(id: number): Promise<Result<UserWithProfile, AppError>>;

  getUserProfileStatus(
    id: number,
  ): Promise<Result<{ complete: boolean }, AppError>>;

  createUserProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ): Promise<Result<UserWithProfile["profile"], AppError>>;

  updateUser(
    id: number,
    updateData: UpdateUser,
  ): Promise<Result<User, AppError>>;

  updateUserProfile(
    userId: number,
    profileData: UpdateUserProfile,
  ): Promise<Result<UserWithProfile, AppError>>;

  changeUserProfileVisibility(
    userId: number,
    isPublic?: boolean | undefined,
  ): Promise<Result<UserProfile, AppError>>;

  changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<
    Result<{ message: string; data: BetterAuthSuccessResponseSchema }, AppError>
  >;

  deactivateSelf(userId: number): Promise<Result<User, AppError>>;

  deactivateUser(
    id: number,
    requestingUserId: number,
  ): Promise<Result<User, AppError>>;

  activateUser(id: number): Promise<Result<User | undefined, AppError>>;

  canSeekJobs(sessionUserId: number): Promise<Result<boolean, AppError>>;

  hasPrerequisiteRoles(
    sessionUserId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ): Promise<Result<boolean, AppError>>;

  deleteSelf(userId: number, token: string): Promise<Result<null, AppError>>;

  getSavedJobsForUser(
    userId: number,
    page?: number,
    limit?: number,
  ): Promise<
    Result<{ items: SavedJobs[]; pagination: PaginationMeta }, AppError>
  >;

  saveJobForCurrentUser(
    userId: number,
    jobId: number,
  ): Promise<Result<{ success: boolean }, AppError>>;

  isJobSavedByUser(
    userId: number,
    jobId: number,
  ): Promise<Result<boolean, AppError>>;

  unsaveJobForCurrentUser(
    userId: number,
    jobId: number,
  ): Promise<Result<{ success: boolean }, AppError>>;

  getAuthenticatedUserIntent(userId: number): Promise<
    Result<
      {
        status: "completed" | "pending";
        intent: "employer" | "seeker";
      },
      AppError
    >
  >;

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
  ): Promise<Result<UserEmailPreferencesSchema, Error>>;
}
