import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { EmptyBody, PaginatedResponse } from "@shared/types";

import type { CandidateSearchServicePort } from "@/modules/organizations/ports/candidate-search-service.port";
import type {
  CandidatePreview,
  SearchCandidatesSchema,
} from "@/validations/candidate-search.validation";

/**
 * Controller for the employer-facing candidate search endpoint.
 * Returns only the allowlisted `CandidatePreview` shape — never spreads
 * the underlying Typesense document.
 */
export class CandidateSearchController extends BaseController {
  constructor(private candidateSearchService: CandidateSearchServicePort) {
    super();
  }

  searchCandidates = async (
    req: Request<
      EmptyBody,
      PaginatedResponse<CandidatePreview>,
      EmptyBody,
      SearchCandidatesSchema["query"]
    >,
    res: Response<PaginatedResponse<CandidatePreview>>,
  ) => {
    // Query has already been validated + coerced by the `validate` middleware.
    const query = req.query;
    const result = await this.candidateSearchService.searchCandidates(query);

    if (result.isSuccess) {
      const { items, pagination } = result.value;
      return this.sendPaginatedResponse<CandidatePreview>(
        res,
        items,
        pagination,
        "Candidates retrieved successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to search candidates",
      );
    }
  };
}
