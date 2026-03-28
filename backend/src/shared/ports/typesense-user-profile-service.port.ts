export interface UserProfileDocument {
  id: string;
  userId: number;
  jobTypes: string[];
  compensationTypes: string[];
  workScheduleDays: string[];
  scheduleTypes: string[];
  workArrangements: string[];
  commuteTime: string | null;
  willingnessToRelocate: string | null;
  volunteerHoursPerWeek: string | null;
  workAreas: string[];
  updatedAt: number;
}

export interface TypesenseUserProfileServicePort {
  upsertUserProfile(doc: UserProfileDocument): Promise<void>;
  deleteUserProfile(userId: string): Promise<void>;
}
