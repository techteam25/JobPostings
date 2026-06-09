import { Router, type RequestHandler } from "express";
import type { JobBoardController } from "../controllers/job-board.controller";
import type { JobBoardGuards } from "@/modules/job-board";
import type { OrganizationsGuards } from "@/modules/organizations";
import validate from "@/middleware/validation.middleware";
import {
  createJobSchema,
  getJobSchema,
  deleteJobSchema,
  updateJobSchema,
} from "@/validations/job.validation";
import {
  searchParams,
  recommendationParams,
} from "@/validations/base.validation";
import { getOrganizationSchema } from "@/validations/organization.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";
import { cacheKeys } from "@shared/infrastructure/cache-keys";

export function createJobBoardRoutes({
  authenticate,
  optionalAuthenticate,
  orgGuards,
  jobBoardGuards,
  controller,
}: {
  authenticate: RequestHandler;
  optionalAuthenticate: RequestHandler;
  orgGuards: Pick<
    OrganizationsGuards,
    | "requireJobPostingRole"
    | "ensureIsOrganizationMember"
    | "requireDeleteJobPermission"
  >;
  jobBoardGuards: JobBoardGuards;
  controller: JobBoardController;
}): Router {
  const router = Router();

  // Public routes (no auth required — mounted before auth middleware in parent)

  // GET /jobs
  router.get(
    "/",
    optionalAuthenticate,
    validate(searchParams),
    // Default key is per-user (the listing payload carries each viewer's
    // `isSaved` flag); omitting keyGenerator falls back to defaultCacheKey.
    cacheMiddleware({ ttl: 300 }),
    controller.getAllJobs,
  );

  // GET /jobs/search
  router.get(
    "/search",
    validate(searchParams),
    cacheMiddleware({ ttl: 300 }),
    controller.searchJobs,
  );

  // GET /jobs/recommendations (must be before /:jobId to avoid param capture)
  router.get(
    "/recommendations",
    authenticate,
    validate(recommendationParams),
    cacheMiddleware({
      ttl: 300,
      // Keyed under its own `recommendations` namespace (not `jobs/...`) so
      // broad `jobs` invalidation on job create/update/delete and save/unsave
      // does not evict this expensive per-user personalized result; it relies
      // on its TTL for freshness.
      keyGenerator: (req) =>
        `recommendations:user:${req.userId}:page:${req.query.page ?? 1}:limit:${req.query.limit ?? 10}`,
    }),
    controller.getRecommendations,
  );

  // Employer routes (require authentication + job posting role)

  // GET /jobs/my/posted (must be before /:jobId to avoid param capture)
  router.get(
    "/my/posted",
    authenticate,
    orgGuards.requireJobPostingRole(),
    cacheMiddleware({ ttl: 300 }),
    controller.getMyJobs,
  );

  // GET /jobs/:jobId (after all literal routes to avoid param capture)
  router.get(
    "/:jobId",
    optionalAuthenticate,
    validate(getJobSchema),
    // Per-user default key (payload carries the viewer's `isSaved` flag).
    cacheMiddleware({ ttl: 300 }),
    controller.getJobById,
  );

  // POST /jobs
  router.post(
    "/",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(createJobSchema),
    invalidateCacheMiddleware(() => cacheKeys.jobs),
    controller.createJob,
  );

  // PUT /jobs/:jobId
  router.put(
    "/:jobId",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(updateJobSchema),
    invalidateCacheMiddleware(() => cacheKeys.jobs),
    controller.updateJob,
  );

  // DELETE /jobs/:jobId
  router.delete(
    "/:jobId",
    authenticate,
    jobBoardGuards.ensureJobOwnership,
    orgGuards.requireDeleteJobPermission(),
    validate(deleteJobSchema),
    // `jobs` is a prefix glob (`cache:jobs*`) that already covers the
    // `jobs/<jobId>` detail key, so no separate per-id invalidation is needed.
    invalidateCacheMiddleware(() => cacheKeys.jobs),
    controller.deleteJob,
  );

  // GET /jobs/employer/:organizationId/jobs
  router.get(
    "/employer/:organizationId/jobs",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(getOrganizationSchema),
    cacheMiddleware({ ttl: 300 }),
    controller.getJobsByEmployer,
  );

  // GET /jobs/employer/:organizationId/jobs/stats
  router.get(
    "/employer/:organizationId/jobs/stats",
    authenticate,
    orgGuards.ensureIsOrganizationMember,
    validate(getOrganizationSchema),
    controller.getOrganizationJobsStats,
  );

  return router;
}
