import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type {
  NewUserProfile,
  UpdateUserProfile,
  User,
  UserProfile,
  UserWithProfile,
} from "@/validations/userProfile.validation";
import type {
  Education,
  InsertEducation,
} from "@/validations/educations.validation";
import type {
  InsertWorkExperience,
  WorkExperience,
} from "@/validations/workExperiences.validation";
import type {
  Certification,
  NewCertification,
} from "@/validations/certifications.validation";
import type { NewSkill, Skill } from "@/validations/skills.validation";
import type { PaginationMeta } from "@shared/types";
import { SavedJobs } from "@/validations/user.validation";
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

  getSavedJobsForUser(
    userId: number,
    page?: number,
    limit?: number,
  ): Promise<
    Result<{ items: SavedJobs[]; pagination: PaginationMeta }, AppError>
  >;

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

  // Education CRUD
  batchAddEducations(
    userId: number,
    data: Omit<InsertEducation, "userProfileId">[],
  ): Promise<Result<Education[], AppError>>;

  updateEducation(
    educationId: number,
    data: Partial<Omit<InsertEducation, "userProfileId">>,
  ): Promise<Result<boolean, AppError>>;

  deleteEducation(educationId: number): Promise<Result<boolean, AppError>>;

  // Work Experience CRUD
  batchAddWorkExperiences(
    userId: number,
    data: Omit<InsertWorkExperience, "userProfileId">[],
  ): Promise<Result<WorkExperience[], AppError>>;

  updateWorkExperience(
    workExperienceId: number,
    data: Partial<Omit<InsertWorkExperience, "userProfileId">>,
  ): Promise<Result<boolean, AppError>>;

  deleteWorkExperience(
    workExperienceId: number,
  ): Promise<Result<boolean, AppError>>;

  // Certification link/unlink/search
  linkCertification(
    userId: number,
    certificationData: NewCertification,
  ): Promise<Result<Certification, AppError>>;

  unlinkCertification(
    userId: number,
    certificationId: number,
  ): Promise<Result<boolean, AppError>>;

  searchCertifications(
    query: string,
  ): Promise<Result<Certification[], AppError>>;

  // Skill link/unlink/search
  linkSkill(
    userId: number,
    skillData: NewSkill,
  ): Promise<Result<Skill, AppError>>;

  unlinkSkill(
    userId: number,
    skillId: number,
  ): Promise<Result<boolean, AppError>>;

  searchSkills(query: string): Promise<Result<Skill[], AppError>>;

  // Profile picture upload
  uploadProfilePicture(
    userId: number,
    file: ProfilePictureFile | undefined,
    correlationId: string,
  ): Promise<Result<{ message: string }, AppError>>;

  // Resume upload
  uploadResume(
    userId: number,
    file: ResumeFile | undefined,
    correlationId: string,
  ): Promise<Result<{ message: string }, AppError>>;

  // Resume delete
  deleteResume(userId: number): Promise<Result<{ message: string }, AppError>>;
}
