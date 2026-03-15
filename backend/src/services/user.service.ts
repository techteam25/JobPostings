import { UserRepository } from "@/repositories/user.repository";
import { EmailService } from "@shared/infrastructure/email.service";
import { BaseService } from "@shared/base/base.service";
import type { UserServicePort } from "@/ports/user-service.port";
import type { UserRepositoryPort } from "@/ports/user-repository.port";
import type { EmailServicePort } from "@/ports/email-service.port";
import type { OrganizationRepositoryPort } from "@/ports/organization-repository.port";
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
import { OrganizationRepository } from "@/repositories/organization.repository";
import { IdentityService } from "@/modules/identity/services/identity.service";
import { IdentityRepository } from "@/modules/identity/repositories/identity.repository";
import { ProfileService } from "@/modules/user-profile/services/profile.service";
import { ProfileRepository } from "@/modules/user-profile/repositories/profile.repository";
import { NotificationsService } from "@/modules/notifications/services/notifications.service";
import { NotificationsRepository } from "@/modules/notifications/repositories/notifications.repository";
import { BullMqEventBus } from "@shared/events";

/**
 * Facade service that delegates to module-specific services.
 * Maintains backward compatibility with UserServicePort while the codebase
 * is incrementally migrated to use module services directly.
 *
 * @deprecated Consumers should migrate to module-specific services:
 *   - IdentityService for auth/account operations
 *   - ProfileService for profile/search/saved-jobs operations
 *   - NotificationsService for email preferences/job alerts
 */
export class UserService extends BaseService implements UserServicePort {
  private identityService: IdentityService;
  private profileService: ProfileService;
  private notificationsService: NotificationsService;

  constructor(
    private userRepository: UserRepositoryPort = new UserRepository(),
    private emailService: EmailServicePort = EmailService.createDefault(),
    private organizationRepository: OrganizationRepositoryPort = new OrganizationRepository(),
  ) {
    super();

    const identityRepository = new IdentityRepository();
    const profileRepository = new ProfileRepository();
    const notificationsRepository = new NotificationsRepository();

    this.identityService = new IdentityService(
      identityRepository,
      this.emailService,
      new BullMqEventBus(),
    );

    this.profileService = new ProfileService(
      profileRepository,
      this.organizationRepository,
    );

    this.notificationsService = new NotificationsService(
      notificationsRepository,
      this.emailService,
      {
        getUserContactInfo: async (userId: number) => {
          const result = await this.profileService.getUserById(userId);
          if (result.isSuccess && result.value) {
            return {
              email: result.value.email,
              fullName: result.value.fullName,
            };
          }
          return null;
        },
      },
    );
  }

  // ─── Profile Methods (delegate to ProfileService) ─────────────────

  async getAllUsers(searchTerm: string = "", page: number, limit: number) {
    return this.profileService.getAllUsers(searchTerm, page, limit);
  }

  async getUserById(id: number) {
    return this.profileService.getUserById(id);
  }

  async getUserProfileStatus(id: number) {
    return this.profileService.getUserProfileStatus(id);
  }

  async createUserProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ) {
    return this.profileService.createUserProfile(userId, profileData);
  }

  async updateUserProfile(userId: number, profileData: UpdateUserProfile) {
    return this.profileService.updateUserProfile(userId, profileData);
  }

  async changeUserProfileVisibility(
    userId: number,
    isPublic: boolean | undefined = false,
  ) {
    return this.profileService.changeUserProfileVisibility(userId, isPublic);
  }

  async canSeekJobs(sessionUserId: number) {
    return this.profileService.canSeekJobs(sessionUserId);
  }

  async hasPrerequisiteRoles(
    sessionUserId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ) {
    return this.profileService.hasPrerequisiteRoles(sessionUserId, roles);
  }

  async getAuthenticatedUserIntent(userId: number) {
    return this.profileService.getAuthenticatedUserIntent(userId);
  }

  async getSavedJobsForUser(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.profileService.getSavedJobsForUser(userId, page, limit);
  }

  async saveJobForCurrentUser(userId: number, jobId: number) {
    return this.profileService.saveJobForCurrentUser(userId, jobId);
  }

  async isJobSavedByUser(userId: number, jobId: number) {
    return this.profileService.isJobSavedByUser(userId, jobId);
  }

  async unsaveJobForCurrentUser(userId: number, jobId: number) {
    return this.profileService.unsaveJobForCurrentUser(userId, jobId);
  }

  // ─── Identity Methods (delegate to IdentityService) ───────────────

  async updateUser(id: number, updateData: UpdateUser) {
    return this.identityService.updateUser(id, updateData);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.identityService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
  }

  async deactivateSelf(userId: number) {
    return this.identityService.deactivateSelf(userId);
  }

  async deactivateUser(id: number, requestingUserId: number) {
    return this.identityService.deactivateUser(id, requestingUserId);
  }

  async activateUser(id: number) {
    return this.identityService.activateUser(id);
  }

  async deleteSelf(userId: number, token: string) {
    return this.identityService.deleteSelf(userId, token);
  }

  // ─── Notifications Methods (delegate to NotificationsService) ─────

  async getEmailPreferences(userId: number) {
    return this.notificationsService.getEmailPreferences(userId);
  }

  async createDefaultEmailPreferences(userId: number) {
    return this.notificationsService.createDefaultEmailPreferences(userId);
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
    return this.notificationsService.updateEmailPreferences(
      userId,
      preferences,
    );
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
    return this.notificationsService.unsubscribeByToken(token, preferences);
  }

  async resubscribeEmailNotifications(userId: number) {
    return this.notificationsService.resubscribeEmailNotifications(userId);
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
    return this.notificationsService.canSendEmailType(userId, emailType);
  }

  async generateUnsubscribeLink(userId: number): Promise<string | null> {
    return this.notificationsService.generateUnsubscribeLink(userId);
  }

  async createJobAlert(userId: number, alertData: CreateJobAlertInput) {
    return this.notificationsService.createJobAlert(userId, alertData);
  }

  async getUserJobAlerts(userId: number, page: number, limit: number) {
    return this.notificationsService.getUserJobAlerts(userId, page, limit);
  }

  async getJobAlertById(userId: number, alertId: number) {
    return this.notificationsService.getJobAlertById(userId, alertId);
  }

  async updateJobAlert(
    userId: number,
    alertId: number,
    updateData: UpdateJobAlertInput,
  ) {
    return this.notificationsService.updateJobAlert(
      userId,
      alertId,
      updateData,
    );
  }

  applyFrequencyChangeSchedule(
    existingAlert: JobAlert,
    updateData: UpdateJobAlertInput,
  ): UpdateJobAlertInput & { lastSentAt?: Date | null } {
    return this.notificationsService.applyFrequencyChangeSchedule(
      existingAlert,
      updateData,
    );
  }

  async deleteJobAlert(userId: number, alertId: number) {
    return this.notificationsService.deleteJobAlert(userId, alertId);
  }

  async togglePauseJobAlert(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ) {
    return this.notificationsService.togglePauseJobAlert(
      userId,
      alertId,
      isPaused,
    );
  }

  async unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    changeSource: "account_settings" | "email_link",
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    return this.notificationsService.unsubscribeByContext(
      userId,
      context,
      changeSource,
      metadata,
    );
  }

  async findEmailPreferencesByToken(token: string) {
    return this.notificationsService.findEmailPreferencesByToken(token);
  }

  async resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    return this.notificationsService.resubscribeByContext(
      userId,
      context,
      metadata,
    );
  }

  async updateEmailPreferenceWithAudit(
    userId: number,
    preferenceType: string,
    newValue: boolean,
    context: "job_seeker" | "employer" | "global",
    changeSource: "account_settings" | "email_link",
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    return this.notificationsService.updateEmailPreferenceWithAudit(
      userId,
      preferenceType,
      newValue,
      context,
      changeSource,
      metadata,
    );
  }
}
