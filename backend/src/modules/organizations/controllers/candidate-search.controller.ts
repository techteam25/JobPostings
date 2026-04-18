import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { PaginatedResponse } from "@shared/types";

import type { CandidateSearchServicePort } from "@/modules/organizations/ports/candidate-search-service.port";
import {
  searchCandidatesQuerySchema,
  type CandidatePreview,
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
    req: Request,
    res: Response<PaginatedResponse<CandidatePreview>>,
  ) => {
    const query = searchCandidatesQuerySchema.parse(req.query);

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
