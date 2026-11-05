/**
 * Port for reading the subset of user profile data needed to compute
 * in-app job recommendations.
 *
 * The job-board module owns the recommendation service but does not own
 * profile/preference data — this port provides a narrow, read-only view
 * of the skills, location, and job preferences required for ranking.
 *
 * Implemented by an adapter in src/shared/adapters/.
 */
export interface RecommendationProfile {
  /** Skill names from userSkills → skills.name */
  skills: string[];
  /** Location (any/all fields may be missing); `null` if no profile row */
  location: { city?: string; state?: string; country?: string } | null;
  /** Preferred job types (e.g. ["full-time", "part-time"]); `null` if not set */
  jobTypes: string[] | null;
  /** Preferred compensation types (e.g. ["paid", "missionary"]); `null` if not set */
  compensationTypes: string[] | null;
}

export interface UserRecommendationProfilePort {
  /**
   * Returns the recommendation profile for a user, or `null` when no
   * active user / profile row exists. An empty-but-present profile
   * returns a populated object with empty arrays / null fields; this
   * distinction lets callers decide between a "no personalization"
   * cold-start path and a "partial profile" best-effort path.
   */
  getRecommendationProfile(
    userId: number,
  ): Promise<RecommendationProfile | null>;
}
