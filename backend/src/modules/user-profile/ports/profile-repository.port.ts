import type {
  NewUserProfile,
  UpdateUserProfile,
  User,
} from "@/validations/userProfile.validation";

export interface ProfileRepositoryPort {
  findByIdWithProfile(id: number): Promise<any>;
  getUserProfileStatus(userId: number): Promise<{ complete: boolean }>;
  createProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ): Promise<any>;
  updateProfile(userId: number, profileData: UpdateUserProfile): Promise<any>;
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
  findActiveUsersIncludingProfile(): Promise<any>;
  canSeekJobs(userId: number): Promise<boolean>;
  getSavedJobsForUser(
    userId: number,
    page: number,
    limit: number,
  ): Promise<any>;
  saveJobForUser(userId: number, jobId: number): Promise<{ success: boolean }>;
  isJobSavedByUser(userId: number, jobId: number): Promise<boolean>;
  unsaveJobForUser(
    userId: number,
    jobId: number,
  ): Promise<{ success: boolean }>;
  getUserIntent(userId: number): Promise<any>;
  updateProfileVisibility(userId: number, isPublic: boolean): Promise<any>;
}
