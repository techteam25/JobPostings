import type {
  PreferenceRepositoryPort,
  ProfileRepositoryPort,
} from "@/modules/user-profile";
import type {
  RecommendationProfile,
  UserRecommendationProfilePort,
} from "@/modules/job-board";

/**
 * Adapter bridging the user-profile module's profile + preference repositories
 * into the job-board module's UserRecommendationProfilePort.
 *
 * Returns `null` when the user has no active row / no profile row — callers
 * treat that as an empty-profile cold start.
 */
export class ProfileToRecommendationAdapter implements UserRecommendationProfilePort {
  constructor(
    private readonly profileRepository: ProfileRepositoryPort,
    private readonly preferenceRepository: PreferenceRepositoryPort,
  ) {}

  async getRecommendationProfile(
    userId: number,
  ): Promise<RecommendationProfile | null> {
    const user = await this.profileRepository.findByIdWithProfile(userId);

    if (!user || !user.profile) {
      return null;
    }

    const { profile } = user;

    const skills =
      profile.skills
        ?.map((entry) => entry.skill?.name)
        .filter((name): name is string => !!name) ?? [];

    const location =
      profile.city || profile.state || profile.country
        ? {
            city: profile.city ?? undefined,
            state: profile.state ?? undefined,
            country: profile.country ?? undefined,
          }
        : null;

    const preferences = await this.preferenceRepository.getPreferences(
      profile.id,
    );

    return {
      skills,
      location,
      jobTypes: preferences?.jobTypes ?? null,
      compensationTypes: preferences?.compensationTypes ?? null,
    };
  }
}
