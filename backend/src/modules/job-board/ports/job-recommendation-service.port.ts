import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type { JobDocumentType } from "@/validations/base.validation";

export interface ScoredJob extends JobDocumentType {
  matchScore: number;
}

export interface JobRecommendationServicePort {
  getRecommendations(
    userId: number,
    page: number,
    limit: number,
  ): Promise<
    Result<
      { jobs: ScoredJob[]; total: number; hasPersonalization: boolean },
      AppError
    >
  >;
}
