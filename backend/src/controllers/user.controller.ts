import { Request, Response } from "express";
import { UserService } from "@/services/user.service";
import { BaseController } from "./base.controller";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  DatabaseError,
} from "@/utils/errors";
import {
  ChangePasswordSchema,
  CreateUserProfile,
  GetUserSchema,
  UserQuerySchema,
  DeleteSelfSchema,
  DeleteUserSchema,
  SavedJobs,
  SavedJobsQuerySchema,
} from "@/validations/user.validation";
import { ApiResponse } from "@/types";
import { auth } from "@/utils/auth";
import {
  UpdateUser,
  UpdateUserProfile,
  User,
  UserProfile,
  UserWithProfile,
} from "@/validations/userProfile.validation";
import { GetJobSchema } from "@/validations/job.validation";

export class UserController extends BaseController {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  getAllUsers = async (
    req: Request<{}, {}, {}, UserQuerySchema["query"]>,
    res: Response,
  ) => {
    try {
      const { page, limit, searchTerm } = req.query;

      const result = await this.userService.getAllUsers({
        page,
        limit,
        searchTerm,
      });

      this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Users retrieved successfully",
      );
    } catch (error) {
      this.handleControllerError(res, error, "Failed to retrieve users", 500);
    }
  };

  getUserById = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const user = await this.userService.getUserById(id);
    if (!user) {
      return this.handleControllerError(
        res,
        new NotFoundError("User not found"),
      );
    }

    return this.sendSuccess<User>(res, user, "User retrieved successfully");
  };

  updateUser = async (
    req: Request<GetUserSchema["params"], {}, UpdateUser>,
    res: Response,
  ) => {
    const id = Number(req.params.id);
    if (!id) {
      return this.handleControllerError(
        res,
        new NotFoundError("User not found"),
      );
    }

    if (!req.user) {
      return this.handleControllerError(
        res,
        new ValidationError("User not authenticated"),
      );
    }

    if (req.user.id !== id) {
      return this.handleControllerError(
        res,
        new ForbiddenError("You can only update your own account"),
      );
    }

    const updateData = req.body;
    const user = await this.userService.updateUser(id, updateData);

    return this.sendSuccess<User>(res, user, "User updated successfully");
  };

  createProfile = async (
    req: Request<{}, {}, CreateUserProfile["body"]>,
    res: Response<ApiResponse<UserProfile>>,
  ) => {
    try {
      const profileData = req.body;

      const profile = await this.userService.createUserProfile(
        req.userId!,
        profileData,
      );

      if (!profile) {
        return res.status(400).json({
          success: false,
          status: "error",
          message: "Failed to create user profile",
          error: "INTERNAL_SERVER_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      // console.log({ profile });

      return res.status(201).json({
        success: true,
        data: profile,
        message: "User profile created",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to create user profile",
        error: error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR",
        timestamp: new Date().toISOString(),
      });
    }
  };

  updateProfile = async (
    req: Request<{}, {}, UpdateUserProfile>,
    res: Response<ApiResponse<UserWithProfile>>,
  ) => {
    try {
      const profileData = req.body;
      const user = await this.userService.updateUserProfile(
        req.userId!,
        profileData,
      );

      if (!user) {
        return res.status(400).json({
          success: false,
          status: "error",
          message: "Failed to update user profile",
          error: "INTERNAL_SERVER_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        data: user,
        message: "User profile updated",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // console.log({ error });
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to update user profile",
        error: error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR",
        timestamp: new Date().toISOString(),
      });
    }
  };

  changePassword = async (
    req: Request<{}, {}, ChangePasswordSchema["body"]>,
    res: Response,
  ) => {
    if (!req.userId) {
      return this.handleControllerError(
        res,
        new ValidationError("User not authenticated"),
      );
    }

    const { currentPassword, newPassword } = req.body;

    const result = await this.userService.changePassword(
      req.userId,
      currentPassword,
      newPassword,
    );

    return this.sendSuccess(res, result, "Password changed successfully");
  };

  getCurrentUser = async (
    req: Request,
    res: Response<ApiResponse<UserWithProfile>>,
  ) => {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        status: "error",
        message: "User not authenticated",
        error: "UNAUTHORIZED",
        timestamp: new Date().toISOString(),
      });
    }

    const user = await this.userService.getUserById(req.userId);

    return res.json({
      success: true,
      data: user,
      message: "Current user retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  };

  deactivateSelf = async (req: Request, res: Response) => {
    if (!req.userId) {
      return this.handleControllerError(
        res,
        new ValidationError("User not authenticated"),
      );
    }

    const result = await this.userService.deactivateSelf(req.userId);
    return this.sendSuccess<User>(
      res,
      result,
      "Account deactivated successfully",
    );
  };

  deactivateUser = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const result = await this.userService.deactivateUser(id, req.user!.id);
    return this.sendSuccess<UserWithProfile>(
      res,
      result,
      "User deactivated successfully",
    );
  };

  activateUser = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const result = await this.userService.activateUser(id);
    return this.sendSuccess<UserWithProfile>(
      res,
      result,
      "User activated successfully",
    );
  };

  deleteSelf = async (
    req: Request<{}, {}, DeleteSelfSchema["body"]>,
    res: Response,
  ) => {
    if (!req.userId) {
      return this.handleControllerError(
        res,
        new ValidationError("User not authenticated"),
      );
    }

    const { currentPassword } = req.body;

    await this.userService.deleteSelf(req.userId, currentPassword); // Todo: replace currentPassword with actual confirmation token

    return this.sendSuccess(res, null, "Account deleted successfully", 204);
  };

  deleteUser = async (
    req: Request<GetUserSchema["params"], {}, DeleteUserSchema["body"]>,
    res: Response,
  ) => {
    const { token } = req.body;

    if (!req.user) {
      return this.handleControllerError(
        res,
        new ValidationError("User not authenticated"),
      );
    }

    // Todo:
    //  This is an admin only action, can admins delete user?
    //  How would this be different with deleteSelf?

    const result = await auth.api.deleteUser({
      body: {
        token,
      },
    });
    return this.sendSuccess(res, result, "User deleted successfully", 200);
  };

  getSavedJobsForCurrentUser = async (
    req: Request<SavedJobsQuerySchema["query"]>,
    res: Response<ApiResponse<SavedJobs>>,
  ) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    try {
      const savedJobs = await this.userService.getSavedJobsForUser(
        req.userId!,
        page,
        limit,
      );
      return this.sendSuccess<SavedJobs>(
        res,
        savedJobs,
        "Saved jobs retrieved successfully",
      );
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Failed to retrieve saved jobs",
        500,
      );
    }
  };

  checkIfJobIsSaved = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<{ isSaved: boolean }>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;
    try {
      const isSaved = await this.userService.isJobSavedByUser(userId, jobId);
      return this.sendSuccess<{ isSaved: boolean }>(
        res,
        { isSaved },
        "Job saved status retrieved successfully",
      );
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Failed to retrieve saved job status",
        500,
      );
    }
  };

  saveJobForCurrentUser = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;
    try {
      await this.userService.saveJobForCurrentUser(userId, jobId);
      return this.sendSuccess(res, null, "Job saved successfully", 200);
    } catch (error) {
      if (error instanceof DatabaseError) {
        if (error.message.includes("does not exist")) {
          return res.status(404).json({
            success: false,
            status: "error",
            message: `Job with id ${jobId} does not exist.`,
            error: "NOT_FOUND",
            timestamp: new Date().toISOString(),
          });
        }
        if (error.message.includes("jobs limit reached")) {
          return res.status(400).json({
            success: false,
            status: "error",
            message:
              "You have reached the maximum limit of saved jobs. You can save up to 50 jobs.",
            error: "BAD_REQUEST",
            timestamp: new Date().toISOString(),
          });
        }
      }
      return this.handleControllerError(
        res,
        error,
        "Failed to retrieve saved jobs",
        500,
      );
    }
  };

  unsaveJobForCurrentUser = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;
    try {
      await this.userService.unsaveJobForCurrentUser(userId, jobId);
      return this.sendSuccess(res, null, "Job unsaved successfully", 200);
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.message.includes("Failed to unsave job: record not found")
      ) {
        return res.status(404).json({
          success: false,
          status: "error",
          message: "Failed to unsave job",
          error: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }
      return this.handleControllerError(
        res,
        error,
        "Failed to unsave job",
        500,
      );
    }
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
