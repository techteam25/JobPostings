import type { Result } from "@shared/result";
import type { PaginationMeta } from "@shared/types";
import type {
  CandidatePreview,
  SearchCandidatesSchema,
} from "@/validations/candidate-search.validation";

export interface CandidateSearchResult {
  items: CandidatePreview[];
  pagination: PaginationMeta;
}

export interface CandidateSearchServicePort {
  searchCandidates(
    filters: SearchCandidatesSchema["query"],
  ): Promise<Result<CandidateSearchResult, Error>>;
}
