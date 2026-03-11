import type { UserService } from "@/services/user.service";
import type {
  NewUserProfile,
  UpdateUser,
  UpdateUserProfile,
} from "@/validations/userProfile.validation";
import type {
  CreateJobAlertInput,
  JobAlert,
  UpdateJobAlertInput,
} from "@/validations/jobAlerts.validation";

/**
 * Port interface for UserService.
 * Defines the public contract for user-related operations.
 */
export interface UserServicePort {
  getAllUsers(
    searchTerm: string | undefined,
    page: number,
    limit: number,
  ): Promise<Awaited<ReturnType<UserService["getAllUsers"]>>>;

  getUserById(
    id: number,
  ): Promise<Awaited<ReturnType<UserService["getUserById"]>>>;

  getUserProfileStatus(
    id: number,
  ): Promise<Awaited<ReturnType<UserService["getUserProfileStatus"]>>>;

  createUserProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ): Promise<Awaited<ReturnType<UserService["createUserProfile"]>>>;

  updateUser(
    id: number,
    updateData: UpdateUser,
  ): Promise<Awaited<ReturnType<UserService["updateUser"]>>>;

  updateUserProfile(
    userId: number,
    profileData: UpdateUserProfile,
  ): Promise<Awaited<ReturnType<UserService["updateUserProfile"]>>>;

  changeUserProfileVisibility(
    userId: number,
    isPublic?: boolean | undefined,
  ): Promise<Awaited<ReturnType<UserService["changeUserProfileVisibility"]>>>;

  changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<Awaited<ReturnType<UserService["changePassword"]>>>;

  deactivateSelf(
    userId: number,
  ): Promise<Awaited<ReturnType<UserService["deactivateSelf"]>>>;

  deactivateUser(
    id: number,
    requestingUserId: number,
  ): Promise<Awaited<ReturnType<UserService["deactivateUser"]>>>;

  activateUser(
    id: number,
  ): Promise<Awaited<ReturnType<UserService["activateUser"]>>>;

  canSeekJobs(
    sessionUserId: number,
  ): Promise<Awaited<ReturnType<UserService["canSeekJobs"]>>>;

  hasPrerequisiteRoles(
    sessionUserId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ): Promise<Awaited<ReturnType<UserService["hasPrerequisiteRoles"]>>>;

  deleteSelf(
    userId: number,
    token: string,
  ): Promise<Awaited<ReturnType<UserService["deleteSelf"]>>>;

  getSavedJobsForUser(
    userId: number,
    page?: number,
    limit?: number,
  ): Promise<Awaited<ReturnType<UserService["getSavedJobsForUser"]>>>;

  saveJobForCurrentUser(
    userId: number,
    jobId: number,
  ): Promise<Awaited<ReturnType<UserService["saveJobForCurrentUser"]>>>;

  isJobSavedByUser(
    userId: number,
    jobId: number,
  ): Promise<Awaited<ReturnType<UserService["isJobSavedByUser"]>>>;

  unsaveJobForCurrentUser(
    userId: number,
    jobId: number,
  ): Promise<Awaited<ReturnType<UserService["unsaveJobForCurrentUser"]>>>;

  getAuthenticatedUserIntent(
    userId: number,
  ): Promise<Awaited<ReturnType<UserService["getAuthenticatedUserIntent"]>>>;

  getEmailPreferences(
    userId: number,
  ): Promise<Awaited<ReturnType<UserService["getEmailPreferences"]>>>;

  createDefaultEmailPreferences(
    userId: number,
  ): Promise<Awaited<ReturnType<UserService["createDefaultEmailPreferences"]>>>;

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
  ): Promise<Awaited<ReturnType<UserService["updateEmailPreferences"]>>>;

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
  ): Promise<Awaited<ReturnType<UserService["unsubscribeByToken"]>>>;

  resubscribeEmailNotifications(
    userId: number,
  ): Promise<Awaited<ReturnType<UserService["resubscribeEmailNotifications"]>>>;

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
  ): Promise<Awaited<ReturnType<UserService["canSendEmailType"]>>>;

  generateUnsubscribeLink(userId: number): Promise<string | null>;

  createJobAlert(
    userId: number,
    alertData: CreateJobAlertInput,
  ): Promise<Awaited<ReturnType<UserService["createJobAlert"]>>>;

  getUserJobAlerts(
    userId: number,
    page: number,
    limit: number,
  ): Promise<Awaited<ReturnType<UserService["getUserJobAlerts"]>>>;

  getJobAlertById(
    userId: number,
    alertId: number,
  ): Promise<Awaited<ReturnType<UserService["getJobAlertById"]>>>;

  updateJobAlert(
    userId: number,
    alertId: number,
    updateData: UpdateJobAlertInput,
  ): Promise<Awaited<ReturnType<UserService["updateJobAlert"]>>>;

  applyFrequencyChangeSchedule(
    existingAlert: JobAlert,
    updateData: UpdateJobAlertInput,
  ): UpdateJobAlertInput & { lastSentAt?: Date | null };

  deleteJobAlert(
    userId: number,
    alertId: number,
  ): Promise<Awaited<ReturnType<UserService["deleteJobAlert"]>>>;

  togglePauseJobAlert(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ): Promise<Awaited<ReturnType<UserService["togglePauseJobAlert"]>>>;

  unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    changeSource: "account_settings" | "email_link",
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<Awaited<ReturnType<UserService["unsubscribeByContext"]>>>;

  findEmailPreferencesByToken(
    token: string,
  ): Promise<Awaited<ReturnType<UserService["findEmailPreferencesByToken"]>>>;

  resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<Awaited<ReturnType<UserService["resubscribeByContext"]>>>;

  updateEmailPreferenceWithAudit(
    userId: number,
    preferenceType: string,
    newValue: boolean,
    context: "job_seeker" | "employer" | "global",
    changeSource: "account_settings" | "email_link",
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<
    Awaited<ReturnType<UserService["updateEmailPreferenceWithAudit"]>>
  >;
}
