import { Request, Response } from "express";
import { UserService } from "@/services/user.service";
import { AuthService } from "@/services/auth.service";
import { BaseController } from "./base.controller";
import { ValidationError, ForbiddenError, NotFoundError } from "@/utils/errors";
import {
  NewUserProfile,
  UpdateUser,
  UpdateUserProfile,
  UserProfile,
  UserWithProfile,
} from "@/db/schema";
import { ChangePasswordData } from "@/db/interfaces/common";
import {
  ChangePasswordSchema,
  CreateUserProfile,
  GetUserSchema,
  UserEmailSchema,
  UserQuerySchema,
} from "@/validations/user.validation";
import { ApiResponse } from "@/types";

export class UserController extends BaseController {
  private userService: UserService;
  private authService: AuthService;

  constructor() {
    super();
    this.userService = new UserService();
    this.authService = new AuthService();
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
        role: req.user?.role,
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

    return this.sendSuccess(res, user, "User retrieved successfully");
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

    if (req.user.role !== "admin" && req.user.id !== id) {
      return this.handleControllerError(
        res,
        new ForbiddenError("You can only update your own account"),
      );
    }

    const updateData = req.body;
    const user = await this.userService.updateUser(
      id,
      updateData,
      req.user.id,
      req.user.role,
    );

    return this.sendSuccess(res, user, "User updated successfully");
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

      console.log({ profileData });

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

    const { currentPassword, newPassword }: ChangePasswordData = req.body;

    await this.userService.changePassword(
      req.userId,
      currentPassword,
      newPassword,
    );
    return this.sendSuccess(res, null, "Password changed successfully");
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

  deactivateUser = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const result = await this.userService.deactivateUser(id, req.user!.id);
    return this.sendSuccess(res, result, "User deactivated successfully");
  };

  activateUser = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const result = await this.userService.activateUser(id);
    return this.sendSuccess(res, result, "User activated successfully");
  };

  deleteUser = async (
    req: Request<{}, {}, UserEmailSchema["body"]>,
    res: Response,
  ) => {
    const { email } = req.body;

    if (!req.user) {
      return this.handleControllerError(
        res,
        new ValidationError("User not authenticated"),
      );
    }

    const result = await this.authService.deleteUser({ email });
    return this.sendSuccess(res, result, "User deleted successfully", 200);
  };

  getUserStats = async (_: Request, res: Response) => {
    const stats = {
      totalUsers: await this.userService.getUsersByRole("user"),
      totalEmployers: await this.userService.getUsersByRole("employer"),
      totalAdmins: await this.userService.getUsersByRole("admin"),
    };

    return this.sendSuccess(
      res,
      {
        users: stats.totalUsers.length,
        employers: stats.totalEmployers.length,
        admins: stats.totalAdmins.length,
        total:
          stats.totalUsers.length +
          stats.totalEmployers.length +
          stats.totalAdmins.length,
      },
      "User statistics retrieved successfully",
    );
  };
}
