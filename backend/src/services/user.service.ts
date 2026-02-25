import { UserRepository } from "@/repositories/user.repository";
import { EmailService } from "@/infrastructure/email.service";
import { BaseService, fail, ok } from "./base.service";
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@/utils/errors";
import { PaginationMeta } from "@/types";
import { SecurityUtils } from "@/utils/security";
import { auth } from "@/utils/auth";
import {
  NewUserProfile,
  UpdateUser,
  UpdateUserProfile,
} from "@/validations/userProfile.validation";
import {
  CreateJobAlertInput,
  JobAlert,
  UpdateJobAlertInput,
} from "@/validations/jobAlerts.validation";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";
import crypto from "crypto";
import { env } from "@/config/env";

/**
 * Service class for managing user-related operations, including CRUD for users and profiles.
 */
export class UserService extends BaseService {
  private userRepository: UserRepository;
  private emailService: EmailService;
  private organizationRepository: OrganizationRepository;

  /**
   * Creates an instance of UserService and initializes repositories and services.
   */
  constructor() {
    super();
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
    this.organizationRepository = new OrganizationRepository();
  }

  /**
   * Retrieves all users with optional search and pagination.
   * @param searchTerm The term to search for in user names or emails.
   * @param page The page number for pagination.
   * @param limit The number of users per page.
   * @returns A Result containing the users and pagination meta or an error.
   */
  async getAllUsers(searchTerm: string = "", page: number, limit: number) {
    const sanitizedSearchTerm = SecurityUtils.sanitizeInput(searchTerm);

    try {
      const result = await this.userRepository.searchUsers(
        sanitizedSearchTerm,
        {
          page,
          limit,
        },
      );
      return ok({
        items: result.items,
        pagination: result.pagination as PaginationMeta, // Ensure type consistency
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve users"));
    }
  }

  /**
   * Retrieves a user by their ID, including profile information.
   * @param id The ID of the user.
   * @returns A Result containing the user or an error.
   */
  async getUserById(id: number) {
    try {
      const user = await this.userRepository.findByIdWithProfile(id);
      if (!user) {
        return fail(new NotFoundError("User", id));
      }

      return ok(user);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve user"));
    }
  }

  /**
   * Retrieves the profile status of a user.
   * @param id The ID of the user.
   * @returns A Result containing the profile status or an error.
   */
  async getUserProfileStatus(id: number) {
    try {
      const status = await this.userRepository.getUserProfileStatus(id);
      if (!status) {
        return fail(
          new DatabaseError("Failed to retrieve user profile status"),
        );
      }

      return ok(status);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve user profile status"));
    }
  }

  /**
   * Creates a user profile for an existing user.
   * @param userId The ID of the user.
   * @param profileData The profile data to create.
   * @returns A Result containing the created profile or an error.
   */
  async createUserProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      const profile = await this.userRepository.createProfile(
        userId,
        profileData,
      );

      return ok(profile);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to create user profile"));
    }
  }

  /**
   * Updates a user's basic information.
   * @param id The ID of the user to update.
   * @param updateData The data to update.
   * @returns A Result containing the updated user or an error.
   */
  async updateUser(id: number, updateData: UpdateUser) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return fail(new NotFoundError("User", id));
      }

      // Validate email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(
          updateData.email,
        );
        if (emailExists) {
          return fail(new ValidationError("Email is already in use"));
        }
      }

      const { status: success } = await auth.api.updateUser({
        body: {
          name: updateData.fullName,
          image: updateData.image as string | undefined,
        },
      });
      if (!success) {
        return fail(new Error("Failed to update user"));
      }

      return await this.getUserById(id);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update user"));
    }
  }

  /**
   * Updates a user's profile information.
   * @param userId The ID of the user.
   * @param profileData The profile data to update.
   * @returns A Result containing the updated profile or an error.
   */
  async updateUserProfile(userId: number, profileData: UpdateUserProfile) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      const updatedProfile = await this.userRepository.updateProfile(
        userId,
        profileData,
      );

      if (!updatedProfile) {
        return fail(new DatabaseError("Failed to update user profile"));
      }

      return ok(updatedProfile);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update user profile"));
    }
  }

  /**
   * Changes the visibility of a user's profile.
   * @param userId The ID of the user.
   * @param isPublic The new visibility status.
   * @returns A Result containing the updated profile or an error.
   */
  async changeUserProfileVisibility(
    userId: number,
    isPublic: boolean | undefined = false,
  ) {
    try {
      const user = await this.userRepository.findUserById(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      const updatedProfile = await this.userRepository.updateProfileVisibility(
        userId,
        isPublic,
      );

      if (!updatedProfile) {
        return fail(new DatabaseError("Failed to update profile visibility"));
      }

      return ok(updatedProfile);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update profile visibility"));
    }
  }

  /**
   * Changes a user's password.
   * @param userId The ID of the user.
   * @param currentPassword The current password.
   * @param newPassword The new password.
   * @returns A Result containing a success message or an error.
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      const res = await auth.api.changePassword({
        body: {
          newPassword,
          currentPassword,
          revokeOtherSessions: true,
        },
      });

      return ok({ message: "Password changed successfully", data: res });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to change password"));
    }
  }

  /**
   * Deactivates the user's own account.
   * @param userId The ID of the user.
   * @returns A Result containing the deactivated user or an error.
   */
  async deactivateSelf(userId: number) {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (user.status !== "active") {
        return fail(new ValidationError("Account is already deactivated"));
      }

      const deactivatedUser = await this.userRepository.deactivateUserAccount(
        userId,
        {
          status: "deactivated",
        },
      );
      if (!deactivatedUser) {
        return fail(new Error("Failed to deactivate account"));
      }

      // Email notification
      await this.emailService.sendAccountDeactivationConfirmation(
        userId,
        deactivatedUser.email,
        deactivatedUser.fullName,
      );

      return ok(deactivatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to deactivate account"));
    }
  }

  /**
   * Deactivates another user's account (admin action).
   * @param id The ID of the user to deactivate.
   * @param requestingUserId The ID of the user making the request.
   * @returns A Result containing the updated user or an error.
   */
  async deactivateUser(id: number, requestingUserId: number) {
    try {
      if (id === requestingUserId) {
        return fail(
          new ValidationError("You cannot deactivate your own account"),
        );
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        return fail(new NotFoundError("User", id));
      }

      if (user.status !== "active") {
        return fail(new ValidationError("User is already deactivated"));
      }

      // Todo: Check permissions with Better-Auth
      // Edge case: Check for active jobs if employer
      // if (user.role === "employer" && user.organizationId) {
      //   const activeJobs = await this.jobService.getActiveJobsByOrganization(
      //     user.organizationId,
      //   );
      //   if (activeJobs.length > 0) {
      //     return this.handleError(
      //       new ValidationError("Cannot deactivate user with active jobs"),
      //     );
      //   }
      // }

      const success = await this.userRepository.update(id, {
        status: "deactivated",
      });
      if (!success) {
        return fail(new Error("Failed to deactivate user"));
      }

      // Queue notification email
      await queueService.addJob(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendAccountDeletionConfirmation",
        {
          userId: id,
          email: user.email,
          fullName: user.fullName,
        },
      );

      return await this.getUserById(id);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to deactivate user"));
    }
  }

  /**
   * Activates a user's account.
   * @param id The ID of the user to activate.
   * @returns A Result containing the updated user or an error.
   */
  async activateUser(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return this.handleError(new NotFoundError("User", id));
    }

    if (user.status === "active") {
      return this.handleError(new ValidationError("User is already active"));
    }

    const success = await this.userRepository.update(id, { status: "active" });
    if (!success) {
      return this.handleError(new Error("Failed to activate user"));
    }

    return await this.getUserById(id);
  }

  /**
   * Checks if a user can seek jobs.
   * @param sessionUserId The ID of the user.
   * @returns A Result containing the permission status or an error.
   */
  async canSeekJobs(sessionUserId: number) {
    try {
      return ok(await this.userRepository.canSeekJobs(sessionUserId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to verify Job Seeker permission"));
    }
  }

  /**
   * Checks if a user has prerequisite roles in an organization.
   * @param sessionUserId The ID of the user.
   * @param roles The roles to check for.
   * @returns A Result containing the role status or an error.
   */
  async hasPrerequisiteRoles(
    sessionUserId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ) {
    try {
      return ok(
        await this.organizationRepository.checkHasElevatedRole(
          sessionUserId,
          roles,
        ),
      );
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to verify organization roles"));
    }
  }

  // Todo: Implement user statistics - Role no longer available directly on user
  // Get user statistics
  // async getUserStats() {
  //   try {
  //     const result = await db
  //       .select({
  //         users: count(sql`CASE WHEN ${user.role} = 'user' THEN 1 END`),
  //         employers: count(
  //           sql`CASE WHEN ${user.role} = 'employer' THEN 1 END`,
  //         ),
  //         admins: count(sql`CASE WHEN ${user.role} = 'admin' THEN 1 END`),
  //         total: count(),
  //       })
  //       .from(user);
  //
  //     const stats = result[0];
  //
  //     if (!stats) {
  //       return {
  //         users: 0,
  //         employers: 0,
  //         admins: 0,
  //         total: 0,
  //       };
  //     }
  //
  //     return {
  //       users: stats.users,
  //       employers: stats.employers,
  //       admins: stats.admins,
  //       total: stats.total,
  //     };
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  /**
   * Deletes the user's own account.
   * @param userId The ID of the user.
   * @param token The verification token for deletion.
   * @returns A Result indicating success or an error.
   */
  async deleteSelf(userId: number, token: string) {
    try {
      const user = await this.userRepository.findByIdWithPassword(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      const userDeleted = await auth.api.deleteUser({
        body: { token },
      });

      if (!userDeleted) {
        return fail(new Error("Failed to delete account"));
      }

      // Queue notification email
      await queueService.addJob(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendAccountDeletionConfirmation",
        {
          userId,
          email: user.email,
          fullName: user.fullName,
        },
      );

      return ok(null);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to delete account"));
    }
  }

  /**
   * Retrieves saved jobs for a user with pagination.
   * @param userId The ID of the user.
   * @param page The page number for pagination.
   * @param limit The number of jobs per page.
   * @returns A Result containing the saved jobs or an error.
   */
  async getSavedJobsForUser(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      return ok(
        await this.userRepository.getSavedJobsForUser(userId, page, limit),
      );
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve saved jobs"));
    }
  }

  /**
   * Saves a job for the current user.
   * @param userId The ID of the user.
   * @param jobId The ID of the job to save.
   * @returns A Result containing the saved job or an error.
   */
  async saveJobForCurrentUser(userId: number, jobId: number) {
    try {
      return ok(await this.userRepository.saveJobForUser(userId, jobId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to save job"));
    }
  }

  /**
   * Checks if a job is saved by a user.
   * @param userId The ID of the user.
   * @param jobId The ID of the job.
   * @returns A Result containing the saved status or an error.
   */
  async isJobSavedByUser(userId: number, jobId: number) {
    try {
      return ok(await this.userRepository.isJobSavedByUser(userId, jobId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to check saved job status"));
    }
  }

  /**
   * Unsaves a job for the current user.
   * @param userId The ID of the user.
   * @param jobId The ID of the job to unsave.
   * @returns A Result containing the unsaved job or an error.
   */
  async unsaveJobForCurrentUser(userId: number, jobId: number) {
    try {
      return ok(await this.userRepository.unsaveJobForUser(userId, jobId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to unsave job"));
    }
  }

  /**
   * Retrieves the onboarding intent for an authenticated user.
   * @param userId The ID of the user.
   * @returns A Result containing the user intent or an error.
   */
  async getAuthenticatedUserIntent(userId: number) {
    try {
      const intent = await this.userRepository.getUserIntent(userId);
      if (!intent) {
        return fail(
          new DatabaseError("Failed to retrieve user onboarding intent"),
        );
      }

      return ok(intent);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(
        new DatabaseError("Failed to retrieve user onboarding intent"),
      );
    }
  }

  /**
   * Generates a secure unsubscribe token.
   * @returns A random 32-byte hex string.
   */
  private generateUnsubscribeToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Retrieves email preferences for a user.
   * @param userId The ID of the user.
   * @returns A Result containing the email preferences or an error.
   */
  async getEmailPreferences(userId: number) {
    try {
      let preferences =
        await this.userRepository.findEmailPreferencesByUserId(userId);

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

  /**
   * Creates default email preferences for a user.
   * @param userId The ID of the user.
   * @returns A Result containing the created email preferences or an error.
   */
  async createDefaultEmailPreferences(userId: number) {
    try {
      const existingPreferences =
        await this.userRepository.findEmailPreferencesByUserId(userId);

      if (existingPreferences) {
        return ok(existingPreferences);
      }

      const unsubscribeToken = this.generateUnsubscribeToken();
      const preferences = await this.userRepository.createEmailPreferences(
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

  /**
   * Updates email preferences for a user.
   * @param userId The ID of the user.
   * @param preferences Partial email preferences to update.
   * @returns A Result containing the updated email preferences or an error.
   */
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
        await this.userRepository.findEmailPreferencesByUserId(userId);

      if (!existingPreferences) {
        return fail(
          new NotFoundError("Email preferences not found for user", userId),
        );
      }

      const updatedPreferences =
        await this.userRepository.updateEmailPreferences(userId, preferences);

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

  /**
   * Unsubscribes a user from emails using an unsubscribe token.
   * @param token The unsubscribe token.
   * @param preferences Optional partial preferences to update.
   * @returns A Result containing the updated email preferences or an error.
   */
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
        await this.userRepository.findEmailPreferencesByToken(token);

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
        await this.userRepository.updateEmailPreferences(
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

  /**
   * Re-enables all email notifications for a user (resubscribe).
   * @param userId The ID of the user.
   * @returns A Result containing the updated email preferences or an error.
   */
  async resubscribeEmailNotifications(userId: number) {
    try {
      const existingPreferences =
        await this.userRepository.findEmailPreferencesByUserId(userId);

      if (!existingPreferences) {
        return fail(
          new NotFoundError("Email preferences not found for user", userId),
        );
      }

      const newToken = this.generateUnsubscribeToken();

      await this.userRepository.refreshUnsubscribeToken(userId, newToken);

      const updatedPreferences =
        await this.userRepository.updateEmailPreferences(userId, {
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

  /**
   * Checks if a user can receive a specific type of email.
   * @param userId The ID of the user.
   * @param emailType The type of email to check.
   * @returns A Result containing a boolean or an error.
   */
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
      const canSend = await this.userRepository.canSendEmailType(
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

  /**
   * Generates an unsubscribe link for a user.
   * @param userId The ID of the user.
   * @returns A Result containing the unsubscribe link or an error.
   */
  async generateUnsubscribeLink(userId: number): Promise<string | null> {
    try {
      const preferences =
        await this.userRepository.findEmailPreferencesByUserId(userId);

      if (!preferences) {
        return null;
      }

      return `${env.SERVER_URL}/api/users/me/email-preferences/unsubscribe/${preferences.unsubscribeToken}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * Creates a new job alert for a user.
   * Validates that user has fewer than 10 active alerts.
   * @param userId The ID of the user.
   * @param alertData The job alert data.
   * @returns A Result containing the created job alert or an error.
   */
  async createJobAlert(userId: number, alertData: CreateJobAlertInput) {
    try {
      // Check if user can create more alerts
      const canCreate = await this.userRepository.canCreateJobAlert(userId);

      if (!canCreate.canCreate) {
        return fail(
          new ValidationError(
            `Maximum active job alerts reached. You have ${canCreate.currentCount} active alerts (limit: ${canCreate.maxAllowed}).`,
          ),
        );
      }

      // Create the alert
      const alert = await this.userRepository.createJobAlert(userId, alertData);

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

  /**
   * Retrieves all job alerts for a user with pagination.
   * @param userId The ID of the user.
   * @param page The page number for pagination.
   * @param limit The number of alerts per page.
   * @returns A Result containing the alerts and pagination meta or an error.
   */
  async getUserJobAlerts(userId: number, page: number, limit: number) {
    try {
      const result = await this.userRepository.getUserJobAlerts(userId, {
        page,
        limit,
      });

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

  /**
   * Retrieves a specific job alert by ID for a user.
   * @param userId The ID of the user.
   * @param alertId The ID of the alert.
   * @returns A Result containing the job alert or an error.
   */
  async getJobAlertById(userId: number, alertId: number) {
    try {
      const alert = await this.userRepository.getJobAlertById(userId, alertId);

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

  /**
   * Updates an existing job alert for a user.
   * Validates ownership and updates only provided fields.
   * @param userId The ID of the user.
   * @param alertId The ID of the alert to update.
   * @param updateData Partial job alert data to update.
   * @returns A Result containing the updated job alert or an error.
   */
  async updateJobAlert(
    userId: number,
    alertId: number,
    updateData: UpdateJobAlertInput,
  ) {
    try {
      const existingAlert = await this.userRepository.getJobAlertById(
        userId,
        alertId,
      );

      if (!existingAlert) {
        return fail(new NotFoundError("Job alert", alertId));
      }

      // Recalibrate lastSentAt when frequency changes
      const dataWithSchedule = this.applyFrequencyChangeSchedule(
        existingAlert,
        updateData,
      );

      // Preview the merged state to validate before persisting
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

      const updatedAlert = await this.userRepository.updateJobAlert(
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

  /**
   * Recalibrates `lastSentAt` when alert frequency changes so the worker
   * picks up the alert at the correct next interval.
   *
   * - Switching to a more frequent cadence (e.g. weekly → daily): set lastSentAt
   *   far enough in the past so the next cron run picks it up immediately.
   * - Switching to a less frequent cadence (e.g. daily → weekly): set lastSentAt
   *   to now so the next send is a full interval from now.
   */
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
      // Switching to more frequent: allow immediate pickup by next cron
      return { ...updateData, lastSentAt: null };
    }

    // Switching to less frequent: anchor from now so next send is a full interval away
    return { ...updateData, lastSentAt: now };
  }

  /**
   * Deletes a job alert for a user.
   * Validates ownership before deletion.
   * @param userId The ID of the user.
   * @param alertId The ID of the alert to delete.
   * @returns A Result containing success status or an error.
   */
  async deleteJobAlert(userId: number, alertId: number) {
    try {
      const existingAlert = await this.userRepository.getJobAlertById(
        userId,
        alertId,
      );

      if (!existingAlert) {
        return fail(new NotFoundError("Job alert", alertId));
      }

      await this.userRepository.deleteJobAlert(userId, alertId);

      return ok(null);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to delete job alert"));
    }
  }

  /**
   * Toggles the pause state of a job alert for a user.
   * @param userId The ID of the user.
   * @param alertId The ID of the alert.
   * @param isPaused The new pause state.
   * @returns A Result containing the updated job alert or an error.
   */
  async togglePauseJobAlert(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ) {
    try {
      const existingAlert = await this.userRepository.getJobAlertById(
        userId,
        alertId,
      );

      if (!existingAlert) {
        return fail(new NotFoundError("Job alert", alertId));
      }

      const updatedAlert = await this.userRepository.updateJobAlertPauseState(
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

  /**
   * Unsubscribes user from specific context with audit logging.
   * @param userId The ID of the user.
   * @param context The context to unsubscribe from.
   * @param changeSource Source of the change.
   * @param metadata Optional metadata (IP, user agent).
   * @returns A Result containing the updated preferences or an error.
   */
  async unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    changeSource: "account_settings" | "email_link",
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    try {
      // Get current preferences
      const currentPrefs =
        await this.userRepository.findEmailPreferencesByUserId(userId);

      if (!currentPrefs) {
        return fail(new NotFoundError("User preferences not found"));
      }

      // Update preferences
      const updated = await this.userRepository.unsubscribeByContext(
        userId,
        context,
      );

      if (!updated) {
        return fail(new DatabaseError("Failed to unsubscribe"));
      }

      // Log to audit trail
      await this.userRepository.logPreferenceChange({
        userId,
        preferenceType: `${context}_unsubscribe`,
        context,
        previousValue: false,
        newValue: true,
        changeSource,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });

      // Send confirmation email
      const userResult = await this.getUserById(userId);
      if (userResult.isSuccess && userResult.value) {
        await this.emailService.sendUnsubscribeConfirmation(
          userId,
          userResult.value.email,
          userResult.value.fullName,
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

  /**
   * Finds email preferences using an unsubscribe token.
   * @param token The unsubscribe token.
   * @returns A Result containing the email preferences or an error.
   */
  async findEmailPreferencesByToken(token: string) {
    try {
      const preferences =
        await this.userRepository.findEmailPreferencesByToken(token);

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

  /**
   * Re-subscribes user to specific context with audit logging.
   * @param userId The ID of the user.
   * @param context The context to re-subscribe to.
   * @param metadata Optional metadata (IP, user agent).
   * @returns A Result containing the updated preferences or an error.
   */
  async resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    try {
      const currentPrefs =
        await this.userRepository.findEmailPreferencesByUserId(userId);

      if (!currentPrefs) {
        return fail(new NotFoundError("User preferences not found"));
      }

      const updated = await this.userRepository.resubscribeByContext(
        userId,
        context,
      );

      if (!updated) {
        return fail(new DatabaseError("Failed to resubscribe"));
      }

      // Log to audit trail
      await this.userRepository.logPreferenceChange({
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

  /**
   * Updates a granular email preference with audit logging.
   * @param userId The ID of the user.
   * @param preferenceType The preference field to update.
   * @param newValue The new value for the preference.
   * @param context The context of the preference.
   * @param changeSource Source of the change.
   * @param metadata Optional metadata (IP, user agent).
   * @returns A Result containing the updated preferences or an error.
   */
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
        await this.userRepository.findEmailPreferencesByUserId(userId);

      if (!currentPrefs) {
        return fail(new NotFoundError("User preferences not found"));
      }

      const previousValue = currentPrefs[
        preferenceType as keyof typeof currentPrefs
      ] as boolean;

      // Update preference
      const updateData = { [preferenceType]: newValue };
      const updated = await this.userRepository.updateEmailPreferences(
        userId,
        updateData,
      );

      if (!updated) {
        return fail(new DatabaseError("Failed to update preference"));
      }

      // Log to audit trail
      await this.userRepository.logPreferenceChange({
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
}
