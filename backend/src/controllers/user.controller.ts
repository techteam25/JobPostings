import { Request, Response } from "express";
import { UserService } from "@/services/user.service";
import { OrganizationService } from "@/services/organization.service";
import { BaseController } from "./base.controller";
import {
  ChangePasswordSchema,
  CreateUserProfile,
  GetUserSchema,
  UserQuerySchema,
  DeleteSelfSchema,
  DeleteUserSchema,
  SavedJobs,
  SavedJobsQuerySchema,
  UserEmailPreferencesSchema,
  UpdateUserEmailPreferences,
  UnsubscribeEmailPreferences,
  UnsubscribeByContext,
  UpdateGranularPreference,
  GetUnsubscribeLandingPage,
} from "@/validations/user.validation";
import { ApiResponse } from "@/types";
import { ValidationError } from "@/utils/errors";
import { auth } from "@/utils/auth";
import {
  UpdateProfileVisibilityInput,
  UpdateUser,
  UpdateUserProfile,
  User,
  UserProfile,
  UserWithProfile,
} from "@/validations/userProfile.validation";
import { GetJobSchema } from "@/validations/job.validation";
import { BetterAuthSuccessResponseSchema } from "@/validations/auth.validation";
import {
  CreateJobAlert,
  GetJobAlert,
  GetUserJobAlertsQuery,
  JobAlert,
  UpdateJobAlert,
  DeleteJobAlert,
  TogglePauseJobAlert,
} from "@/validations/jobAlerts.validation";

/**
 * Controller class for handling user-related API endpoints.
 */
export class UserController extends BaseController {
  private userService: UserService;
  private organizationService: OrganizationService;

  /**
   * Creates an instance of UserController and initializes the required services.
   */
  constructor() {
    super();
    this.userService = new UserService();
    this.organizationService = new OrganizationService();
  }

  /**
   * Retrieves all users with pagination and search.
   * @param req The Express request object with query parameters.
   * @param res The Express response object.
   */
  getAllUsers = async (
    req: Request<{}, {}, {}, UserQuerySchema["query"]>,
    res: Response,
  ) => {
    const { searchTerm } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await this.userService.getAllUsers(searchTerm, page, limit);

    if (result.isSuccess) {
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        result.value.pagination,
        "Users retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves a user by their ID.
   * @param req The Express request object with user ID parameters.
   * @param res The Express response object.
   */
  getUserById = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const result = await this.userService.getUserById(id);

    if (result.isSuccess) {
      return this.sendSuccess<User>(
        res,
        result.value,
        "User retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Updates a user's basic information.
   * @param req The Express request object with user ID parameters and update data.
   * @param res The Express response object.
   */
  updateUser = async (
    req: Request<GetUserSchema["params"], {}, UpdateUser>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const updateData = req.body;
    const user = await this.userService.updateUser(id, updateData);

    if (user.isSuccess) {
      return this.sendSuccess<User>(
        res,
        user.value,
        "User updated successfully",
      );
    } else {
      return this.handleControllerError(res, user.error);
    }
  };

  /**
   * Creates a user profile for the authenticated user.
   * @param req The Express request object with profile creation data.
   * @param res The Express response object.
   */
  createProfile = async (
    req: Request<{}, {}, CreateUserProfile["body"]>,
    res: Response<ApiResponse<UserProfile>>,
  ) => {
    const profileData = req.body;

    const profile = await this.userService.createUserProfile(
      req.userId!,
      profileData,
    );

    if (profile.isSuccess) {
      return this.sendSuccess(res, profile.value, "User profile created", 201);
    } else {
      return this.handleControllerError(res, profile.error);
    }
  };

  /**
   * Updates the authenticated user's profile.
   * @param req The Express request object with profile update data.
   * @param res The Express response object.
   */
  updateProfile = async (
    req: Request<{}, {}, UpdateUserProfile>,
    res: Response<ApiResponse<UserWithProfile>>,
  ) => {
    const profileData = req.body;
    const user = await this.userService.updateUserProfile(
      req.userId!,
      profileData,
    );

    if (user.isSuccess) {
      return this.sendSuccess<UserWithProfile>(
        res,
        user.value,
        "User profile updated successfully",
      );
    } else {
      return this.handleControllerError(res, user.error);
    }
  };

  changeProfileVisibility = async (
    req: Request<{}, {}, UpdateProfileVisibilityInput["body"]>,
    res: Response,
  ) => {
    const { isProfilePublic } = req.body;

    const result = await this.userService.changeUserProfileVisibility(
      req.userId!,
      isProfilePublic,
    );

    if (result.isSuccess) {
      return this.sendSuccess<UserProfile>(
        res,
        result.value,
        "Profile visibility updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Changes the authenticated user's password.
   * @param req The Express request object with password change data.
   * @param res The Express response object.
   */
  changePassword = async (
    req: Request<{}, {}, ChangePasswordSchema["body"]>,
    res: Response,
  ) => {
    const { currentPassword, newPassword } = req.body;

    const result = await this.userService.changePassword(
      req.userId!,
      currentPassword,
      newPassword,
    );

    if (result.isSuccess) {
      return this.sendSuccess<{
        message: string;
        data: BetterAuthSuccessResponseSchema;
      }>(res, result.value, "Password changed successfully");
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves the authenticated user's information.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  getCurrentUser = async (
    req: Request,
    res: Response<ApiResponse<UserWithProfile>>,
  ) => {
    const user = await this.userService.getUserById(req.userId!);

    if (user.isSuccess) {
      return this.sendSuccess<UserWithProfile>(
        res,
        user.value,
        "Current user retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, user.error);
    }
  };

  /**
   * Retrieves the profile completion status for the authenticated user.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  getUserProfileStatus = async (req: Request, res: Response) => {
    const user = await this.userService.getUserProfileStatus(req.userId!);

    if (user.isSuccess) {
      return this.sendSuccess<{ complete: boolean }>(
        res,
        user.value,
        "User profile status retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, user.error);
    }
  };

  /**
   * Deactivates the authenticated user's account.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  deactivateSelf = async (req: Request, res: Response) => {
    const result = await this.userService.deactivateSelf(req.userId!);

    if (result.isSuccess) {
      return this.sendSuccess<User>(
        res,
        result.value,
        "Account deactivated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Deactivates another user's account (admin action).
   * @param req The Express request object with user ID parameters.
   * @param res The Express response object.
   */
  deactivateUser = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const result = await this.userService.deactivateUser(id, req.userId!);

    if (result.isSuccess) {
      return this.sendSuccess<UserWithProfile>(
        res,
        result.value,
        "User deactivated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Activates a user's account.
   * @param req The Express request object with user ID parameters.
   * @param res The Express response object.
   */
  activateUser = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const result = await this.userService.activateUser(id);

    if (result.isSuccess) {
      return this.sendSuccess<UserWithProfile>(
        res,
        result.value,
        "User activated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Deletes the authenticated user's account.
   * @param req The Express request object with deletion confirmation data.
   * @param res The Express response object.
   */
  deleteSelf = async (
    req: Request<{}, {}, DeleteSelfSchema["body"]>,
    res: Response,
  ) => {
    const { currentPassword } = req.body;

    const result = await this.userService.deleteSelf(
      req.userId!,
      currentPassword,
    ); // Todo: replace currentPassword with actual confirmation token

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Account deleted successfully", 204);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Deletes a user account (admin action).
   * @param req The Express request object with user ID parameters and deletion token.
   * @param res The Express response object.
   */
  deleteUser = async (
    req: Request<GetUserSchema["params"], {}, DeleteUserSchema["body"]>,
    res: Response,
  ) => {
    const { token } = req.body;

    // Todo:
    //  This is an admin only action, can admins delete user?
    //  How would this be different with deleteSelf?

    const result = await auth.api.deleteUser({
      body: {
        token,
      },
    });
    return this.sendSuccess(res, null, "User deleted successfully", 200);
  };

  /**
   * Retrieves saved jobs for the authenticated user with pagination.
   * @param req The Express request object with query parameters.
   * @param res The Express response object.
   */
  getSavedJobsForCurrentUser = async (
    req: Request<{}, {}, {}, SavedJobsQuerySchema["query"]>,
    res: Response<ApiResponse<SavedJobs>>,
  ) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const savedJobs = await this.userService.getSavedJobsForUser(
      req.userId!,
      page,
      limit,
    );

    if (savedJobs.isSuccess) {
      return this.sendPaginatedResponse<SavedJobs>(
        res,
        savedJobs.value.items,
        savedJobs.value.pagination,
        "Saved jobs retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, savedJobs.error);
    }
  };

  /**
   * Checks if a job is saved by the authenticated user.
   * @param req The Express request object with job ID parameters.
   * @param res The Express response object.
   */
  checkIfJobIsSaved = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<{ isSaved: boolean }>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;

    const isSaved = await this.userService.isJobSavedByUser(userId, jobId);

    if (isSaved.isSuccess) {
      return this.sendSuccess<{ isSaved: boolean }>(
        res,
        { isSaved: isSaved.value },
        "Job saved status retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, isSaved.error);
    }
  };

  /**
   * Saves a job for the authenticated user.
   * @param req The Express request object with job ID parameters.
   * @param res The Express response object.
   */
  saveJobForCurrentUser = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;

    const result = await this.userService.saveJobForCurrentUser(userId, jobId);

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Job saved successfully", 200);
    } else {
      // console.log("Error saving job:", result.error);
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Unsaves a job for the authenticated user.
   * @param req The Express request object with job ID parameters.
   * @param res The Express response object.
   */
  unsaveJobForCurrentUser = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;

    const result = await this.userService.unsaveJobForCurrentUser(
      userId,
      jobId,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Job unsaved successfully", 200);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves the onboarding intent for the authenticated user.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  getCurrentUserIntent = async (req: Request, res: Response) => {
    const intentResult = await this.userService.getAuthenticatedUserIntent(
      req.userId!,
    );

    if (intentResult.isSuccess) {
      return this.sendSuccess<{
        status: "completed" | "pending";
        intent: "employer" | "seeker";
      }>(res, intentResult.value, "User intent retrieved successfully");
    } else {
      return this.handleControllerError(res, intentResult.error);
    }
  };

  /**
   * Retrieves all organizations the authenticated user belongs to.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  getUserOrganizations = async (req: Request, res: Response) => {
    const result = await this.organizationService.getUserOrganizations(
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "User organizations retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves email preferences for the authenticated user.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  getEmailPreferences = async (
    req: Request,
    res: Response<UserEmailPreferencesSchema>,
  ) => {
    const result = await this.userService.getEmailPreferences(req.userId!);

    if (result.isSuccess) {
      return this.sendSuccess<UserEmailPreferencesSchema>(
        res,
        result.value,
        "Email preferences retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Updates email preferences for the authenticated user.
   * @param req The Express request object with preferences in body.
   * @param res The Express response object.
   */
  updateEmailPreferences = async (
    req: Request<{}, {}, UpdateUserEmailPreferences["body"]>,
    res: Response,
  ) => {
    const preferences = req.body;

    if (preferences.accountSecurityAlerts === false) {
      return this.sendError(
        res,
        new ValidationError("Security alerts cannot be disabled"),
      );
    }

    const result = await this.userService.updateEmailPreferences(
      req.userId!,
      preferences,
    );

    if (result.isSuccess) {
      return this.sendSuccess<UserEmailPreferencesSchema>(
        res,
        result.value,
        "Email preferences updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Unsubscribes a user from emails using a token.
   * @param req The Express request object with token in params.
   * @param res The Express response object.
   */
  unsubscribeByToken = async (
    req: Request<
      UnsubscribeEmailPreferences["params"],
      {},
      UserEmailPreferencesSchema
    >,
    res: Response,
  ) => {
    const { token } = req.params;
    const preferences = req.body;

    const result = await this.userService.unsubscribeByToken(
      token,
      preferences,
    );

    if (result.isSuccess) {
      return this.sendSuccess<UserEmailPreferencesSchema>(
        res,
        result.value,
        "Successfully unsubscribed from email notifications",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Re-enables all email notifications for the authenticated user.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  resubscribeEmailNotifications = async (req: Request, res: Response) => {
    const result = await this.userService.resubscribeEmailNotifications(
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess<UserEmailPreferencesSchema>(
        res,
        result.value,
        "Successfully resubscribed to email notifications",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Creates a new job alert for the authenticated user.
   * Validates that user has fewer than 10 active alerts.
   * @param req The Express request object with alert data.
   * @param res The Express response object.
   */
  createJobAlert = async (
    req: Request<{}, {}, CreateJobAlert["body"]>,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const alertData = req.body;
    const userId = req.userId!;

    const result = await this.userService.createJobAlert(userId, alertData);

    if (result.isSuccess) {
      return this.sendSuccess<JobAlert>(
        res,
        result.value,
        "Job alert created successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves all job alerts for the authenticated user with pagination.
   * @param req The Express request object with query parameters.
   * @param res The Express response object.
   */
  getUserJobAlerts = async (
    req: Request<{}, {}, GetUserJobAlertsQuery["query"]>,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const userId = req.userId!;

    const result = await this.userService.getUserJobAlerts(userId, page, limit);

    if (result.isSuccess) {
      return this.sendPaginatedResponse<JobAlert>(
        res,
        result.value.items,
        result.value.pagination,
        "Job alerts retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Retrieves a specific job alert by ID for the authenticated user.
   * @param req The Express request object with alert ID parameter.
   * @param res The Express response object.
   */
  getJobAlertById = async (
    req: Request<GetJobAlert["params"]>,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const alertId = Number(req.params.id);
    const userId = req.userId!;

    const result = await this.userService.getJobAlertById(userId, alertId);

    if (result.isSuccess) {
      return this.sendSuccess<JobAlert>(
        res,
        result.value,
        "Job alert retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Updates an existing job alert for the authenticated user.
   * All fields are optional - only provided fields will be updated.
   * @param req The Express request object with alert ID and update data.
   * @param res The Express response object.
   */
  updateJobAlert = async (
    req: Request<UpdateJobAlert["params"], {}, UpdateJobAlert["body"]>,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const alertId = Number(req.params.id);
    const userId = req.userId!;
    const updateData = req.body;

    const result = await this.userService.updateJobAlert(
      userId,
      alertId,
      updateData,
    );

    if (result.isSuccess) {
      return this.sendSuccess<JobAlert>(
        res,
        result.value,
        "Job alert updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Deletes a job alert for the authenticated user.
   * @param req The Express request object with alert ID parameter.
   * @param res The Express response object.
   */
  deleteJobAlert = async (
    req: Request<DeleteJobAlert["params"]>,
    res: Response<ApiResponse<null>>,
  ) => {
    const alertId = Number(req.params.id);
    const userId = req.userId!;

    const result = await this.userService.deleteJobAlert(userId, alertId);

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Job alert deleted successfully", 204);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Toggles the pause state of a job alert for the authenticated user.
   * @param req The Express request object with alert ID and pause state.
   * @param res The Express response object.
   */
  togglePauseJobAlert = async (
    req: Request<
      TogglePauseJobAlert["params"],
      {},
      TogglePauseJobAlert["body"]
    >,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const alertId = Number(req.params.id);
    const userId = req.userId!;
    const { isPaused } = req.body;

    const result = await this.userService.togglePauseJobAlert(
      userId,
      alertId,
      isPaused,
    );

    if (result.isSuccess) {
      return this.sendSuccess<JobAlert>(
        res,
        result.value,
        `Job alert ${isPaused ? "paused" : "resumed"} successfully`,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Unsubscribes user from specific context (job_seeker/employer/global).
   * @param req The Express request object.
   * @param res The Express response object.
   */
  unsubscribeByContext = async (
    req: Request<{}, {}, UnsubscribeByContext["body"]>,
    res: Response,
  ) => {
    const userId = req.userId!;
    const { context } = req.body;

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result = await this.userService.unsubscribeByContext(
      userId,
      context,
      "account_settings",
      metadata,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        `Successfully unsubscribed from ${context.replace("_", " ")} emails`,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Re-subscribes user to specific context.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  resubscribeByContext = async (
    req: Request<{}, {}, UnsubscribeByContext["body"]>,
    res: Response,
  ) => {
    const userId = req.userId!;
    const { context } = req.body;

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result = await this.userService.resubscribeByContext(
      userId,
      context,
      metadata,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        `Successfully re-subscribed to ${context.replace("_", " ")} emails`,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Updates a granular email preference.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  updateGranularEmailPreference = async (
    req: Request<{}, {}, UpdateGranularPreference["body"]>,
    res: Response,
  ) => {
    const userId = req.userId!;
    const { preferenceType, enabled, context } = req.body;

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result = await this.userService.updateEmailPreferenceWithAudit(
      userId,
      preferenceType,
      enabled,
      context,
      "account_settings",
      metadata,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Email preference updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Gets unsubscribe landing page data by token (public endpoint).
   * @param req The Express request object.
   * @param res The Express response object.
   */
  getUnsubscribeLandingPageData = async (
    req: Request<GetUnsubscribeLandingPage["params"]>,
    res: Response,
  ) => {
    const { token } = req.params;

    const prefsResult =
      await this.userService.findEmailPreferencesByToken(token);

    if (prefsResult.isSuccess && prefsResult.value) {
      const userResult = await this.userService.getUserById(
        prefsResult.value.userId,
      );

      if (userResult.isSuccess && userResult.value) {
        return this.sendSuccess(res, {
          user: {
            name: userResult.value.fullName,
            email: userResult.value.email,
          },
          preferences: prefsResult.value,
          token,
        });
      }
    }

    return this.handleControllerError(
      res,
      new Error("Invalid or expired unsubscribe token"),
    );
  };

  // getUserStats = async (_: Request, res: Response) => {
  //   const stats = {
  //     totalUsers: await this.userService.getUsersByRole("user"),
  //     totalEmployers: await this.userService.getUsersByRole("employer"),
  //     totalAdmins: await this.userService.getUsersByRole("admin"),
  //   };
  //
  //   return this.sendSuccess(
  //     res,
  //     {
  //       users: stats.totalUsers.length,
  //       employers: stats.totalEmployers.length,
  //       admins: stats.totalAdmins.length,
  //       total:
  //         stats.totalUsers.length +
  //         stats.totalEmployers.length +
  //         stats.totalAdmins.length,
  //     },
  //     "User statistics retrieved successfully",
  //   );
  // };
}
