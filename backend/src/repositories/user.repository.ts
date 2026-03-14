import { user } from "@/db/schema";
import { BaseRepository } from "@shared/base/base.repository";
import type { UserRepositoryPort } from "@/ports/user-repository.port";
import type {
  NewUserProfile,
  UpdateUserProfile,
  User,
} from "@/validations/userProfile.validation";
import type { InsertJobAlert } from "@/validations/jobAlerts.validation";
import { IdentityRepository } from "@/modules/identity/repositories/identity.repository";
import { ProfileRepository } from "@/modules/user-profile/repositories/profile.repository";
import { NotificationsRepository } from "@/modules/notifications/repositories/notifications.repository";

/**
 * Facade repository that delegates to module-specific repositories.
 * Maintains backward compatibility with UserRepositoryPort while the codebase
 * is incrementally migrated to use module repositories directly.
 *
 * @deprecated Consumers should migrate to module-specific repositories:
 *   - IdentityRepository for auth/account operations
 *   - ProfileRepository for profile/search/saved-jobs operations
 *   - NotificationsRepository for email preferences/job alerts
 */
export class UserRepository
  extends BaseRepository<typeof user>
  implements UserRepositoryPort
{
  private identityRepository: IdentityRepository;
  private profileRepository: ProfileRepository;
  private notificationsRepository: NotificationsRepository;

  constructor() {
    super(user);
    this.identityRepository = new IdentityRepository();
    this.profileRepository = new ProfileRepository();
    this.notificationsRepository = new NotificationsRepository();
  }

  // ─── Identity Methods ──────────────────────────────────────────────

  async findByEmail(email: string): Promise<User | undefined> {
    return this.identityRepository.findByEmail(email);
  }

  async findByIdWithPassword(id: number): Promise<User | undefined> {
    return this.identityRepository.findByIdWithPassword(id);
  }

  async findUserById(id: number) {
    return this.identityRepository.findUserById(id);
  }

  async deactivateUserAccount(
    id: number,
    data: { status: "active" | "deactivated" | "deleted" },
  ) {
    return this.identityRepository.deactivateUserAccount(id, data);
  }

  // ─── Profile Methods ──────────────────────────────────────────────

  async findByIdWithProfile(id: number) {
    return this.profileRepository.findByIdWithProfile(id);
  }

  async getUserProfileStatus(userId: number) {
    return this.profileRepository.getUserProfileStatus(userId);
  }

  async createProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ) {
    return this.profileRepository.createProfile(userId, profileData);
  }

  async updateProfile(userId: number, profileData: UpdateUserProfile) {
    return this.profileRepository.updateProfile(userId, profileData);
  }

  async searchUsers(
    searchTerm: string,
    options?: { page?: number; limit?: number },
  ) {
    return this.profileRepository.searchUsers(searchTerm, options);
  }

  async findActiveUsersIncludingProfile() {
    return this.profileRepository.findActiveUsersIncludingProfile();
  }

  async canSeekJobs(userId: number): Promise<boolean> {
    return this.profileRepository.canSeekJobs(userId);
  }

  async getSavedJobsForUser(userId: number, page: number, limit: number) {
    return this.profileRepository.getSavedJobsForUser(userId, page, limit);
  }

  async saveJobForUser(userId: number, jobId: number) {
    return this.profileRepository.saveJobForUser(userId, jobId);
  }

  async isJobSavedByUser(userId: number, jobId: number) {
    return this.profileRepository.isJobSavedByUser(userId, jobId);
  }

  async unsaveJobForUser(userId: number, jobId: number) {
    return this.profileRepository.unsaveJobForUser(userId, jobId);
  }

  async getUserIntent(userId: number) {
    return this.profileRepository.getUserIntent(userId);
  }

  async updateProfileVisibility(userId: number, isPublic: boolean) {
    return this.profileRepository.updateProfileVisibility(userId, isPublic);
  }

  // ─── Notifications Methods ────────────────────────────────────────

  async findEmailPreferencesByUserId(userId: number) {
    return this.notificationsRepository.findEmailPreferencesByUserId(userId);
  }

  async findEmailPreferencesByToken(token: string) {
    return this.notificationsRepository.findEmailPreferencesByToken(token);
  }

  async createEmailPreferences(userId: number, unsubscribeToken: string) {
    return this.notificationsRepository.createEmailPreferences(
      userId,
      unsubscribeToken,
    );
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
    return this.notificationsRepository.updateEmailPreferences(
      userId,
      preferences,
    );
  }

  async refreshUnsubscribeToken(userId: number, newToken: string) {
    return this.notificationsRepository.refreshUnsubscribeToken(
      userId,
      newToken,
    );
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
    return this.notificationsRepository.canSendEmailType(userId, emailType);
  }

  async canCreateJobAlert(userId: number) {
    return this.notificationsRepository.canCreateJobAlert(userId);
  }

  async createJobAlert(
    userId: number,
    alertData: Omit<InsertJobAlert, "userId">,
  ) {
    return this.notificationsRepository.createJobAlert(userId, alertData);
  }

  async getUserJobAlerts(
    userId: number,
    pagination: { page: number; limit: number },
  ) {
    return this.notificationsRepository.getUserJobAlerts(userId, pagination);
  }

  async getJobAlertById(userId: number, alertId: number) {
    return this.notificationsRepository.getJobAlertById(userId, alertId);
  }

  async updateJobAlert(
    userId: number,
    alertId: number,
    updateData: Partial<Omit<InsertJobAlert, "userId" | "id">>,
  ) {
    return this.notificationsRepository.updateJobAlert(
      userId,
      alertId,
      updateData,
    );
  }

  async deleteJobAlert(userId: number, alertId: number) {
    return this.notificationsRepository.deleteJobAlert(userId, alertId);
  }

  async updateJobAlertPauseState(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ) {
    return this.notificationsRepository.updateJobAlertPauseState(
      userId,
      alertId,
      isPaused,
    );
  }

  async getAlertsForProcessing(
    frequency: "daily" | "weekly" | "monthly",
    cutoffTime: Date,
  ) {
    return this.notificationsRepository.getAlertsForProcessing(
      frequency,
      cutoffTime,
    );
  }

  async updateAlertLastSentAt(alertId: number, timestamp: Date) {
    return this.notificationsRepository.updateAlertLastSentAt(
      alertId,
      timestamp,
    );
  }

  async saveAlertMatches(
    matches: Array<{
      jobAlertId: number;
      jobId: number;
      matchScore: number;
    }>,
  ) {
    return this.notificationsRepository.saveAlertMatches(matches);
  }

  async getUnsentMatches(alertId: number, limit?: number) {
    return this.notificationsRepository.getUnsentMatches(alertId, limit);
  }

  async markMatchesAsSent(matchIds: number[]) {
    return this.notificationsRepository.markMatchesAsSent(matchIds);
  }

  async getUnsentMatchCount(alertId: number) {
    return this.notificationsRepository.getUnsentMatchCount(alertId);
  }

  async pauseAlertsForInactiveUsers(inactiveUserIds: number[]) {
    return this.notificationsRepository.pauseAlertsForInactiveUsers(
      inactiveUserIds,
    );
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
    return this.notificationsRepository.logPreferenceChange(data);
  }

  async getUserAuditHistory(userId: number, limit?: number) {
    return this.notificationsRepository.getUserAuditHistory(userId, limit);
  }

  async setEmployerEmailPreferences(userId: number) {
    return this.notificationsRepository.setEmployerEmailPreferences(userId);
  }

  async unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ) {
    return this.notificationsRepository.unsubscribeByContext(userId, context);
  }

  async resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ) {
    return this.notificationsRepository.resubscribeByContext(userId, context);
  }
}
