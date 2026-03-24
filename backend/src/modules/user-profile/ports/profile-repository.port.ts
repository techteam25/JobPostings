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
import { SavedJobs } from "@/validations/user.validation";
import { PaginationMeta } from "@shared/types";

export interface ProfileRepositoryPort {
  findByIdWithProfile(id: number): Promise<UserWithProfile | undefined>;
  getUserProfileStatus(userId: number): Promise<{ complete: boolean }>;
  createProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ): Promise<UserWithProfile["profile"] | undefined>;
  updateProfile(
    userId: number,
    profileData: UpdateUserProfile,
  ): Promise<UserWithProfile | undefined>;
  searchUsers(
    searchTerm: string,
    options?: { page?: number; limit?: number },
  ): Promise<{
    items: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
  findActiveUsersIncludingProfile(): Promise<UserWithProfile[] | undefined>;
  canSeekJobs(userId: number): Promise<boolean>;
  getSavedJobsForUser(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{ items: SavedJobs[]; pagination: PaginationMeta }>;
  saveJobForUser(userId: number, jobId: number): Promise<{ success: boolean }>;
  isJobSavedByUser(userId: number, jobId: number): Promise<boolean>;
  getSavedJobIdsForJobs(userId: number, jobIds: number[]): Promise<Set<number>>;
  unsaveJobForUser(
    userId: number,
    jobId: number,
  ): Promise<{ success: boolean }>;
  getUserIntent(userId: number): Promise<
    | {
        status: "completed" | "pending";
        intent: "employer" | "seeker";
      }
    | undefined
  >;
  updateProfileVisibility(
    userId: number,
    isPublic: boolean,
  ): Promise<UserProfile | undefined>;

  // Education CRUD
  addEducation(
    userProfileId: number,
    data: Omit<InsertEducation, "userProfileId">,
  ): Promise<Education>;
  updateEducation(
    educationId: number,
    data: Partial<Omit<InsertEducation, "userProfileId">>,
  ): Promise<boolean>;
  deleteEducation(educationId: number): Promise<boolean>;

  // Work Experience CRUD
  addWorkExperience(
    userProfileId: number,
    data: Omit<InsertWorkExperience, "userProfileId">,
  ): Promise<WorkExperience>;
  updateWorkExperience(
    workExperienceId: number,
    data: Partial<Omit<InsertWorkExperience, "userProfileId">>,
  ): Promise<boolean>;
  deleteWorkExperience(workExperienceId: number): Promise<boolean>;

  // Certification link/unlink
  linkCertification(
    userProfileId: number,
    certificationData: NewCertification,
  ): Promise<Certification>;
  unlinkCertification(
    userProfileId: number,
    certificationId: number,
  ): Promise<boolean>;

  // Skill link/unlink
  linkSkill(userProfileId: number, skillId: number): Promise<boolean>;
  unlinkSkill(userProfileId: number, skillId: number): Promise<boolean>;
}
