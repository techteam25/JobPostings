import { Request, Response } from "express";
import { UserService } from "@/services/user.service";
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
import { BetterAuthSuccessResponseSchema } from "@/validations/auth.validation";

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
    return this.sendSuccess(res, result, "User deleted successfully", 200);
  };

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
      return this.sendSuccess<SavedJobs>(
        res,
        savedJobs.value,
        "Saved jobs retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, savedJobs.error);
    }
  };

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
