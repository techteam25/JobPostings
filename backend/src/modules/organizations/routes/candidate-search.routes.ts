import { Router, type RequestHandler } from "express";

import type { CandidateSearchController } from "../controllers/candidate-search.controller";
import type { OrganizationsGuards } from "@/modules/organizations";
import validate from "@/middleware/validation.middleware";
import { cacheMiddleware } from "@/middleware/cache.middleware";
import { pathKey } from "@shared/infrastructure/cache-keys";
import { auditRead } from "@/middleware/audit-read.middleware";
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
   * Cache is org-agnostic and shared across employers (keyed on query params
   * only). Safe because the response contains no org- or user-scoped data and
   * `requireJobPostingRole` runs before the cache middleware. An explicit
   * `keyGenerator` is required because the default key appends `:user:<id>`
   * once `authenticate` populates `req.userId`, which would silently fragment
   * this shared cache per employer.
   *
   * @route GET /candidates/search
   */
  router.get(
    "/candidates/search",
    authenticate,
    orgGuards.requireJobPostingRole(),
    auditRead("read.profile.cross_user", () => ({ type: "candidate_search" })),
    validate(searchCandidatesSchema),
    cacheMiddleware({ ttl: 300, keyGenerator: pathKey }),
    controller.searchCandidates,
  );

  return router;
}
