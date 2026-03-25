import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { ProfileServicePort } from "@/modules/user-profile";
import type { UserOrganizationsQueryPort } from "@/modules/user-profile/ports/org-query.port";
import type {
  CreateUserProfile,
  GetUserSchema,
  SavedJobs,
  SavedJobsQuerySchema,
  UserQuerySchema,
} from "@/validations/user.validation";
import type { GetJobSchema } from "@/validations/job.validation";
import type {
  BatchCreateEducationsInput,
  UpdateEducationRouteInput,
  DeleteEducationRouteInput,
} from "@/validations/educations.validation";
import type {
  BatchCreateWorkExperiencesInput,
  UpdateWorkExperienceRouteInput,
  DeleteWorkExperienceRouteInput,
} from "@/validations/workExperiences.validation";
import type {
  LinkCertificationInput,
  UnlinkCertificationInput,
  SearchCertificationsInput,
} from "@/validations/certifications.validation";
import type { ApiResponse, EmptyBody } from "@shared/types";
import type {
  UpdateProfileVisibilityInput,
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

  getSavedJobsForCurrentUser = async (
    req: Request<
      EmptyBody,
      EmptyBody,
      EmptyBody,
      SavedJobsQuerySchema["query"]
    >,
    res: Response<ApiResponse<SavedJobs>>,
  ) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const savedJobs = await this.profileService.getSavedJobsForUser(
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

  checkIfJobIsSaved = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<{ isSaved: boolean }>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;

    const isSaved = await this.profileService.isJobSavedByUser(userId, jobId);

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

    const result = await this.profileService.saveJobForCurrentUser(
      userId,
      jobId,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Job saved successfully", 200);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  unsaveJobForCurrentUser = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;

    const result = await this.profileService.unsaveJobForCurrentUser(
      userId,
      jobId,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Job unsaved successfully", 200);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  batchCreateEducations = async (
    req: Request<EmptyBody, EmptyBody, BatchCreateEducationsInput["body"]>,
    res: Response,
  ) => {
    const { educations } = req.body;

    const result = await this.profileService.batchAddEducations(
      req.userId!,
      educations,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Education entries added successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  updateEducation = async (
    req: Request<
      UpdateEducationRouteInput["params"],
      EmptyBody,
      UpdateEducationRouteInput["body"]
    >,
    res: Response,
  ) => {
    const educationId = Number(req.params.educationId);

    const result = await this.profileService.updateEducation(
      educationId,
      req.body,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Education updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deleteEducation = async (
    req: Request<DeleteEducationRouteInput["params"]>,
    res: Response,
  ) => {
    const educationId = Number(req.params.educationId);

    const result = await this.profileService.deleteEducation(educationId);

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Education deleted successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  // Work Experience CRUD

  batchCreateWorkExperiences = async (
    req: Request<EmptyBody, EmptyBody, BatchCreateWorkExperiencesInput["body"]>,
    res: Response,
  ) => {
    const { workExperiences } = req.body;

    const result = await this.profileService.batchAddWorkExperiences(
      req.userId!,
      workExperiences,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Work experience entries added successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  updateWorkExperience = async (
    req: Request<
      UpdateWorkExperienceRouteInput["params"],
      EmptyBody,
      UpdateWorkExperienceRouteInput["body"]
    >,
    res: Response,
  ) => {
    const workExperienceId = Number(req.params.workExperienceId);

    const result = await this.profileService.updateWorkExperience(
      workExperienceId,
      req.body,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Work experience updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deleteWorkExperience = async (
    req: Request<DeleteWorkExperienceRouteInput["params"]>,
    res: Response,
  ) => {
    const workExperienceId = Number(req.params.workExperienceId);

    const result =
      await this.profileService.deleteWorkExperience(workExperienceId);

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Work experience deleted successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  // Certification CRUD

  linkCertification = async (
    req: Request<EmptyBody, EmptyBody, LinkCertificationInput["body"]>,
    res: Response,
  ) => {
    const result = await this.profileService.linkCertification(
      req.userId!,
      req.body,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Certification linked successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  unlinkCertification = async (
    req: Request<UnlinkCertificationInput["params"]>,
    res: Response,
  ) => {
    const certificationId = Number(req.params.certificationId);

    const result = await this.profileService.unlinkCertification(
      req.userId!,
      certificationId,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Certification unlinked successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  searchCertifications = async (
    req: Request<
      EmptyBody,
      EmptyBody,
      EmptyBody,
      SearchCertificationsInput["query"]
    >,
    res: Response,
  ) => {
    const result = await this.profileService.searchCertifications(req.query.q);

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, "Certifications found");
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
