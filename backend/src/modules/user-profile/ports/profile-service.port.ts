import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type {
  NewUserProfile,
  UpdateUserProfile,
} from "@/validations/userProfile.validation";
import type { PaginationMeta } from "@shared/types";

export interface ProfileServicePort {
  getAllUsers(
    searchTerm: string | undefined,
    page: number,
    limit: number,
  ): Promise<
    Result<{ items: any[]; pagination: PaginationMeta }, AppError>
  >;

  getUserById(id: number): Promise<Result<any, AppError>>;

  getUserProfileStatus(
    id: number,
  ): Promise<Result<{ complete: boolean }, AppError>>;

  createUserProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ): Promise<Result<any, AppError>>;

  updateUserProfile(
    userId: number,
    profileData: UpdateUserProfile,
  ): Promise<Result<any, AppError>>;

  changeUserProfileVisibility(
    userId: number,
    isPublic?: boolean,
  ): Promise<Result<any, AppError>>;

  canSeekJobs(sessionUserId: number): Promise<Result<boolean, AppError>>;

  hasPrerequisiteRoles(
    sessionUserId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ): Promise<Result<boolean, AppError>>;

  getAuthenticatedUserIntent(userId: number): Promise<Result<any, AppError>>;

  getSavedJobsForUser(
    userId: number,
    page?: number,
    limit?: number,
  ): Promise<Result<any, AppError>>;

  saveJobForCurrentUser(
    userId: number,
    jobId: number,
  ): Promise<Result<{ success: boolean }, AppError>>;

  isJobSavedByUser(
    userId: number,
    jobId: number,
  ): Promise<Result<boolean, AppError>>;

  unsaveJobForCurrentUser(
    userId: number,
    jobId: number,
  ): Promise<Result<{ success: boolean }, AppError>>;
}
