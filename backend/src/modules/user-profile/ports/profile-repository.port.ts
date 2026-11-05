import type {
  NewUserProfile,
  UpdateUserProfile,
  User,
  UserProfile,
  UserWithProfile,
} from "@/validations/userProfile.validation";
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
  getUserIntent(userId: number): Promise<
    | {
        status: "completed" | "pending";
        intent: "employer" | "seeker";
      }
    | undefined
  >;
  completeOnboarding(userId: number): Promise<boolean>;
  initializeUserIntent(
    userId: number,
    intent: "seeker" | "employer",
  ): Promise<void>;
  updateProfileVisibility(
    userId: number,
    isPublic: boolean,
  ): Promise<UserProfile | undefined>;
  updateWorkAvailability(
    userId: number,
    isAvailable: boolean,
  ): Promise<UserProfile | undefined>;
}
