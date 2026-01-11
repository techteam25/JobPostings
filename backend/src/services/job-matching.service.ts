import { BaseService, fail, ok, Result } from "./base.service";
import { DatabaseError } from "@/utils/errors";
import { Job } from "@/validations/job.validation";
import { TypesenseService } from "@/infrastructure/typesense.service/typesense.service";
import { JobAlert } from "@/validations/jobAlerts.validation";
import { TypesenseQueryBuilder } from "@/utils/typesense-queryBuilder";
import logger from "@/logger";

export class JobMatchingService extends BaseService {
  private typesenseService: TypesenseService;

  constructor() {
    super();
    this.typesenseService = new TypesenseService();
  }

  /**
   * Finds matching jobs for a job alert using Typesense search.
   * @param alert The job alert to find matches for.
   * @param limit Maximum number of results to return.
   * @returns Array of matching jobs with relevance scores.
   */
  async findMatchingJobsForAlert(
    alert: JobAlert,
    limit: number = 50,
  ): Promise<
    Result<Array<{ job: Partial<Job>; matchScore: number }>, DatabaseError>
  > {
    try {
      // Build Typesense filter string using TypesenseQueryBuilder
      const queryBuilder = new TypesenseQueryBuilder();

      // Add location filters with remote fallback
      if (alert.city || alert.state) {
        queryBuilder.addLocationFilters(
          {
            city: alert.city || undefined,
            state: alert.state || undefined,
          },
          true, // includeRemote
        );
      }

      // Add job type filter
      // Note: Alert schema uses underscores (full_time), but database and Typesense use hyphens (full-time)
      if (alert.jobType && alert.jobType.length > 0) {
        const normalizedJobTypes = alert.jobType.map((type) =>
          type.replace(/_/g, "-"),
        ) as (
          | "full-time"
          | "part-time"
          | "contract"
          | "volunteer"
          | "internship"
        )[];
        queryBuilder.addArrayFilter("jobType", normalizedJobTypes, true);
      }

      // Add experience level filter
      if (alert.experienceLevel) {
        queryBuilder.addArrayFilter("experience", alert.experienceLevel);
      }

      // Add skills filters (use OR logic for flexibility)
      if (alert.skills && alert.skills.length > 0) {
        queryBuilder.addSkillFilters(alert.skills, false);
      }

      const filterString = queryBuilder.build();

      logger.info("Searching for alert matches", {
        alertId: alert.id,
        searchQuery: alert.searchQuery,
        filters: filterString,
        lastSentAt: alert.lastSentAt,
      });

      // Search using Typesense
      const searchResponse = await this.typesenseService.searchJobsForAlert(
        alert.searchQuery,
        filterString,
        alert.lastSentAt,
        limit,
      );

      if (!searchResponse.hits || searchResponse.hits.length === 0) {
        logger.info("No matches found for alert", { alertId: alert.id });
        return ok([]);
      }

      // Map results to jobs with scores
      const matches = searchResponse.hits.map((hit) => {
        const job = hit.document;

        // Calculate composite score: 70% relevance + 30% recency
        const textMatchInfo = hit.text_match_info;
        const relevanceScore = textMatchInfo?.score
          ? parseFloat(textMatchInfo.score)
          : 0;

        const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
        const age = Math.max(0, Date.now() / 1000 - job.createdAt);
        const recencyScore = Math.max(0, 1 - age / maxAge);
        const matchScore = relevanceScore * 0.7 + recencyScore * 100 * 0.3;

        return {
          job: {
            id: parseInt(job.id),
            title: job.title,
            description: job.description,
            city: job.city || "",
            state: job.state || null,
            country: job.country || "",
            zipcode: null,
            isRemote: job.isRemote,
            jobType: job.jobType as
              | "full-time"
              | "part-time"
              | "contract"
              | "volunteer"
              | "internship",
            experience: job.experience || null,
            createdAt: new Date(job.createdAt * 1000),
          },
          matchScore: Math.round(matchScore * 100) / 100, // Round to 2 decimals
        };
      });

      // Sort by match score descending
      matches.sort((a, b) => b.matchScore - a.matchScore);

      logger.info("Found matches for alert", {
        alertId: alert.id,
        matchCount: matches.length,
        topScore: matches[0]?.matchScore,
      });

      return ok(matches);
    } catch (error) {
      logger.error("Failed to find matching jobs for alert", {
        alertId: alert.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return fail(new DatabaseError("Failed to find matching jobs", error));
    }
  }
}
