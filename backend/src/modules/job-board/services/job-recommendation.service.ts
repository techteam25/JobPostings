import { fail, ok, Result } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import { AppError, DatabaseError } from "@shared/errors";
import { TypesenseQueryBuilder } from "@shared/infrastructure/typesense.service/typesense-queryBuilder";
import logger from "@shared/logger";

import type { TypesenseJobServicePort } from "@shared/ports/typesense-service.port";
import type {
  UserRecommendationProfilePort,
  JobRecommendationServicePort,
  ScoredJob,
} from "@/modules/job-board";

export class JobRecommendationService
  extends BaseService
  implements JobRecommendationServicePort
{
  constructor(
    private typesenseService: TypesenseJobServicePort,
    private userRecommendationProfile: UserRecommendationProfilePort,
  ) {
    super();
  }

  async getRecommendations(
    userId: number,
    page: number,
    limit: number,
  ): Promise<
    Result<
      { jobs: ScoredJob[]; total: number; hasPersonalization: boolean },
      AppError
    >
  > {
    try {
      const profile =
        await this.userRecommendationProfile.getRecommendationProfile(userId);

      const hasSkills = profile !== null && profile.skills.length > 0;
      const hasPreferences =
        profile !== null &&
        (profile.jobTypes !== null || profile.compensationTypes !== null);
      const hasLocation = profile?.location !== null;
      const hasPersonalization = hasSkills || hasPreferences;

      // Build search query from user skills
      const q = hasSkills ? profile.skills.join(" ") : "*";

      // Build filters
      const queryBuilder = new TypesenseQueryBuilder();
      queryBuilder.addSingleFilter("isActive", true);

      if (hasPreferences && profile.jobTypes && profile.jobTypes.length > 0) {
        queryBuilder.addArrayFilter("jobType", profile.jobTypes, true);
      }

      if (
        hasPreferences &&
        profile.compensationTypes &&
        profile.compensationTypes.length > 0
      ) {
        queryBuilder.addArrayFilter(
          "compensationType",
          profile.compensationTypes,
          true,
        );
      }

      if (profile !== null && profile.location) {
        const { city, state, country } = profile.location;
        if (city || state || country) {
          queryBuilder.addLocationFilters({ city, state, country }, true);
        }
      }

      const filters = queryBuilder.build();

      // Determine sort: use relevance when skills provide a meaningful query,
      // fall back to recency when q is "*"
      const useRelevanceSort = hasSkills;

      logger.info("Fetching job recommendations", {
        userId,
        hasSkills,
        hasPreferences,
        hasLocation,
        q: q === "*" ? "*" : `[${profile!.skills.length} skills]`,
        filters,
        page,
        limit,
      });

      const searchResponse =
        await this.typesenseService.searchJobsForRecommendations(q, filters, {
          page,
          limit,
          ...(useRelevanceSort
            ? {}
            : { sortBy: "createdAt", sortDirection: "desc" as const }),
        });

      if (!searchResponse.hits || searchResponse.hits.length === 0) {
        return ok({
          jobs: [],
          total: searchResponse.found ?? 0,
          hasPersonalization,
        });
      }

      // Map and score results
      const jobs: ScoredJob[] = searchResponse.hits.map((hit) => {
        const doc = hit.document;

        if (!useRelevanceSort) {
          return { ...doc, matchScore: 0 };
        }

        // Composite score: 70% relevance + 30% recency (mirrors JobMatchingService)
        const textMatchInfo = hit.text_match_info;
        const relevanceScore = textMatchInfo?.score
          ? parseFloat(textMatchInfo.score)
          : 0;

        const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
        const age = Math.max(0, Date.now() / 1000 - doc.createdAt);
        const recencyScore = Math.max(0, 1 - age / maxAge);
        const matchScore = relevanceScore * 0.7 + recencyScore * 100 * 0.3;

        return { ...doc, matchScore };
      });

      // Sort by score descending when using relevance
      if (useRelevanceSort) {
        jobs.sort((a, b) => b.matchScore - a.matchScore);
      }

      return ok({
        jobs,
        total: searchResponse.found ?? 0,
        hasPersonalization,
      });
    } catch (error) {
      logger.error("Failed to fetch job recommendations", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return fail(
        new DatabaseError(
          "Failed to fetch job recommendations",
          error as Error,
        ),
      );
    }
  }
}
