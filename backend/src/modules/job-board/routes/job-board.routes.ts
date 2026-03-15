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
import { searchParams } from "@/validations/base.validation";
import { getOrganizationSchema } from "@/validations/organization.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";

export function createJobBoardRoutes({
  authenticate,
  orgGuards,
  jobBoardGuards,
  controller,
}: {
  authenticate: RequestHandler;
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
    validate(searchParams),
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

  // GET /jobs/:jobId
  router.get(
    "/:jobId",
    validate(getJobSchema),
    cacheMiddleware({ ttl: 300 }),
    controller.getJobById,
  );

  // Employer routes (require authentication + job posting role)

  // GET /jobs/my/posted
  router.get(
    "/my/posted",
    authenticate,
    orgGuards.requireJobPostingRole(),
    cacheMiddleware({ ttl: 300 }),
    controller.getMyJobs,
  );

  // POST /jobs
  router.post(
    "/",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(createJobSchema),
    invalidateCacheMiddleware(() => `/api/jobs`),
    controller.createJob,
  );

  // PUT /jobs/:jobId
  router.put(
    "/:jobId",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(updateJobSchema),
    invalidateCacheMiddleware(() => `/api/jobs`),
    controller.updateJob,
  );

  // DELETE /jobs/:jobId
  router.delete(
    "/:jobId",
    authenticate,
    jobBoardGuards.ensureJobOwnership,
    orgGuards.requireDeleteJobPermission(),
    validate(deleteJobSchema),
    invalidateCacheMiddleware(() => `/api/jobs`),
    invalidateCacheMiddleware((req) => `/api/jobs/${req.params.jobId}`),
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
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(getOrganizationSchema),
    controller.getOrganizationJobsStats,
  );

  return router;
}
