import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type {
  NewUserProfile,
  UpdateUserProfile,
  User,
  UserProfile,
  UserWithProfile,
} from "@/validations/userProfile.validation";
import type { PaginationMeta } from "@shared/types";
import {
  ProfilePictureFile,
  ResumeFile,
} from "@/modules/user-profile/types/profile.module.types";

export interface ProfileServicePort {
  getAllUsers(
    searchTerm: string | undefined,
    page: number,
    limit: number,
  ): Promise<Result<{ items: User[]; pagination: PaginationMeta }, AppError>>;

  getUserById(id: number): Promise<Result<UserWithProfile, AppError>>;

  getUserProfileStatus(
    id: number,
  ): Promise<Result<{ complete: boolean }, AppError>>;

  createUserProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ): Promise<Result<UserWithProfile["profile"], AppError>>;

  updateUserProfile(
    userId: number,
    profileData: UpdateUserProfile,
  ): Promise<Result<UserWithProfile, AppError>>;

  changeUserProfileVisibility(
    userId: number,
    isPublic?: boolean,
  ): Promise<Result<UserProfile, AppError>>;

  changeWorkAvailability(
    userId: number,
    isAvailable?: boolean,
  ): Promise<Result<UserProfile, AppError>>;

  canSeekJobs(sessionUserId: number): Promise<Result<boolean, AppError>>;

  hasPrerequisiteRoles(
    sessionUserId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ): Promise<Result<boolean, AppError>>;

  getAuthenticatedUserIntent(userId: number): Promise<
    Result<
      {
        status: "completed" | "pending";
        intent: "employer" | "seeker";
      },
      AppError
    >
  >;

  completeOnboarding(
    userId: number,
    userInfo: { email: string; fullName: string },
  ): Promise<Result<{ status: "completed" }, AppError>>;

  initializeUserIntent(
    userId: number,
    intent: "seeker" | "employer",
  ): Promise<Result<void, AppError>>;

  uploadProfilePicture(
    userId: number,
    file: ProfilePictureFile | undefined,
    correlationId: string,
  ): Promise<Result<{ message: string }, AppError>>;

  uploadResume(
    userId: number,
    file: ResumeFile | undefined,
    correlationId: string,
  ): Promise<Result<{ message: string }, AppError>>;

  deleteResume(userId: number): Promise<Result<{ message: string }, AppError>>;
}
