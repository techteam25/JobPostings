import { UserRepository } from "@/repositories/user.repository";
import { EmailService } from "@/services/email.service";
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
import { OrganizationRepository } from "@/repositories/organization.repository";
import { emailSenderQueue } from "@/utils/bullmq.utils";

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

      return ok(await this.userRepository.createProfile(userId, profileData));
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
      await emailSenderQueue.add("sendAccountDeletionConfirmation", {
        email: user.email,
        fullName: user.fullName,
      });

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
      await emailSenderQueue.add("sendAccountDeletionConfirmation", {
        email: user.email,
        fullName: user.fullName,
      });

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
}
