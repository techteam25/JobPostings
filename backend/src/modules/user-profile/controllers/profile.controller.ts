import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { ProfileServicePort } from "@/modules/user-profile";
import type { UserOrganizationsQueryPort } from "@/modules/user-profile/ports/org-query.port";
import type {
  CreateUserProfile,
  GetUserSchema,
  UserQuerySchema,
} from "@/validations/user.validation";
import type { ApiResponse, EmptyBody } from "@shared/types";
import type {
  UpdateProfileVisibilityInput,
  UpdateWorkAvailabilityInput,
  UpdateUserProfile,
  User,
  UserProfile,
  UserWithProfile,
} from "@/validations/userProfile.validation";

export class ProfileController extends BaseController {
  constructor(
    private profileService: ProfileServicePort,
    private userOrgsQuery: UserOrganizationsQueryPort,
  ) {
    super();
  }

  getAllUsers = async (
    req: Request<EmptyBody, EmptyBody, EmptyBody, UserQuerySchema["query"]>,
    res: Response,
  ) => {
    const { searchTerm } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await this.profileService.getAllUsers(
      searchTerm,
      page,
      limit,
    );

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

    const result = await this.profileService.getUserById(id);

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

  getCurrentUser = async (
    req: Request,
    res: Response<ApiResponse<UserWithProfile>>,
  ) => {
    const user = await this.profileService.getUserById(req.userId!);

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
    const user = await this.profileService.getUserProfileStatus(req.userId!);

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

  createProfile = async (
    req: Request<EmptyBody, EmptyBody, CreateUserProfile["body"]>,
    res: Response<ApiResponse<UserProfile>>,
  ) => {
    const profileData = req.body;

    const profile = await this.profileService.createUserProfile(
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
    req: Request<EmptyBody, EmptyBody, UpdateUserProfile>,
    res: Response<ApiResponse<UserWithProfile>>,
  ) => {
    const profileData = req.body;
    const user = await this.profileService.updateUserProfile(
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

  uploadProfilePicture = async (req: Request, res: Response) => {
    const file = req.file;

    const result = await this.profileService.uploadProfilePicture(
      req.userId!,
      file,
      req.correlationId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess<{ message: string }>(
        res,
        result.value,
        "Profile picture upload initiated",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  uploadResume = async (req: Request, res: Response) => {
    const file = req.file;

    const result = await this.profileService.uploadResume(
      req.userId!,
      file,
      req.correlationId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess<{ message: string }>(
        res,
        result.value,
        "Resume upload initiated",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deleteResume = async (req: Request, res: Response) => {
    const result = await this.profileService.deleteResume(req.userId!);

    if (result.isSuccess) {
      return this.sendSuccess<{ message: string }>(
        res,
        result.value,
        "Resume deleted",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  changeProfileVisibility = async (
    req: Request<EmptyBody, EmptyBody, UpdateProfileVisibilityInput["body"]>,
    res: Response,
  ) => {
    const { isProfilePublic } = req.body;

    const result = await this.profileService.changeUserProfileVisibility(
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

  changeWorkAvailability = async (
    req: Request<EmptyBody, EmptyBody, UpdateWorkAvailabilityInput["body"]>,
    res: Response,
  ) => {
    const { isAvailableForWork } = req.body;

    const result = await this.profileService.changeWorkAvailability(
      req.userId!,
      isAvailableForWork,
    );

    if (result.isSuccess) {
      return this.sendSuccess<UserProfile>(
        res,
        result.value,
        "Work availability updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  getCurrentUserIntent = async (req: Request, res: Response) => {
    const intentResult = await this.profileService.getAuthenticatedUserIntent(
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

  completeOnboarding = async (req: Request, res: Response) => {
    const result = await this.profileService.completeOnboarding(req.userId!, {
      email: req.user!.email,
      fullName: req.user!.fullName,
    });

    if (result.isSuccess) {
      return this.sendSuccess<{ status: "completed" }>(
        res,
        result.value,
        "Onboarding completed successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  getUserOrganizations = async (req: Request, res: Response) => {
    const result = await this.userOrgsQuery.getUserOrganizations(req.userId!);

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
}
