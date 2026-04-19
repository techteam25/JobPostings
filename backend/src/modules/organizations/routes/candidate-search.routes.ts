import { Router, type RequestHandler } from "express";

import type { CandidateSearchController } from "../controllers/candidate-search.controller";
import type { OrganizationsGuards } from "@/modules/organizations";
import validate from "@/middleware/validation.middleware";
import { cacheMiddleware } from "@/middleware/cache.middleware";
import { searchCandidatesSchema } from "@/validations/candidate-search.validation";

export function createCandidateSearchRoutes({
  authenticate,
  orgGuards,
  controller,
}: {
  authenticate: RequestHandler;
  orgGuards: Pick<OrganizationsGuards, "requireJobPostingRole">;
  controller: CandidateSearchController;
}): Router {
  const router = Router();

  /**
   * Searches public candidate profiles by skill overlap + optional filters.
   * Employer-facing — requires a job-posting role in ≥1 organization.
   *
   * Cache is org-agnostic (default query-param key). Safe because the
   * response contains no org-scoped data and `requireJobPostingRole`
   * runs before the cache middleware.
   *
   * @route GET /candidates/search
   */
  router.get(
    "/candidates/search",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(searchCandidatesSchema),
    cacheMiddleware({ ttl: 300 }),
    controller.searchCandidates,
  );

  return router;
}
