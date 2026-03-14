import { Router, type RequestHandler } from "express";
import { JobBoardController } from "@/modules/job-board";
import { JobBoardService } from "@/modules/job-board";
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
import type { JobBoardRepositoryPort } from "@/modules/job-board";
import type { JobInsightsRepositoryPort } from "@/modules/job-board";
import type { OrganizationRepositoryPort } from "@/ports/organization-repository.port";
import type { UserRepositoryPort } from "@/ports/user-repository.port";
import type { TypesenseServicePort } from "@/ports/typesense-service.port";
import type { ApplicationStatusQueryPort } from "@/modules/job-board/ports/application-status-query.port";

export function createJobBoardRoutes({
  authenticate,
  orgGuards,
  jobBoardGuards,
  jobBoardRepository,
  jobInsightsRepository,
  typesenseService,
  organizationRepository,
  userRepository,
  applicationStatusQuery,
}: {
  authenticate: RequestHandler;
  orgGuards: Pick<OrganizationsGuards, "requireJobPostingRole" | "ensureIsOrganizationMember" | "requireDeleteJobPermission">;
  jobBoardGuards: JobBoardGuards;
  jobBoardRepository: JobBoardRepositoryPort;
  jobInsightsRepository: JobInsightsRepositoryPort;
  typesenseService: TypesenseServicePort;
  organizationRepository: OrganizationRepositoryPort;
  userRepository: UserRepositoryPort;
  applicationStatusQuery: ApplicationStatusQueryPort;
}): Router {
  const router = Router();

  const jobBoardService = new JobBoardService(
    jobBoardRepository,
    organizationRepository,
    jobInsightsRepository,
    typesenseService,
    userRepository,
    applicationStatusQuery,
  );
  const jobBoardController = new JobBoardController(jobBoardService);

  // Public routes (no auth required — mounted before auth middleware in parent)

  // GET /jobs
  router.get(
    "/",
    validate(searchParams),
    cacheMiddleware({ ttl: 300 }),
    jobBoardController.getAllJobs,
  );

  // GET /jobs/search
  router.get(
    "/search",
    validate(searchParams),
    cacheMiddleware({ ttl: 300 }),
    jobBoardController.searchJobs,
  );

  // GET /jobs/:jobId
  router.get(
    "/:jobId",
    validate(getJobSchema),
    cacheMiddleware({ ttl: 300 }),
    jobBoardController.getJobById,
  );

  // Employer routes (require authentication + job posting role)

  // GET /jobs/my/posted
  router.get(
    "/my/posted",
    authenticate,
    orgGuards.requireJobPostingRole(),
    cacheMiddleware({ ttl: 300 }),
    jobBoardController.getMyJobs,
  );

  // POST /jobs
  router.post(
    "/",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(createJobSchema),
    invalidateCacheMiddleware((_req) => `/api/jobs`),
    jobBoardController.createJob,
  );

  // PUT /jobs/:jobId
  router.put(
    "/:jobId",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(updateJobSchema),
    invalidateCacheMiddleware((_req) => `/api/jobs`),
    jobBoardController.updateJob,
  );

  // DELETE /jobs/:jobId
  router.delete(
    "/:jobId",
    authenticate,
    jobBoardGuards.ensureJobOwnership,
    orgGuards.requireDeleteJobPermission(),
    validate(deleteJobSchema),
    invalidateCacheMiddleware((_req) => `/api/jobs`),
    invalidateCacheMiddleware((req) => `/api/jobs/${req.params.jobId}`),
    jobBoardController.deleteJob,
  );

  // GET /jobs/employer/:organizationId/jobs
  router.get(
    "/employer/:organizationId/jobs",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(getOrganizationSchema),
    cacheMiddleware({ ttl: 300 }),
    jobBoardController.getJobsByEmployer,
  );

  // GET /jobs/employer/:organizationId/jobs/stats
  router.get(
    "/employer/:organizationId/jobs/stats",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(getOrganizationSchema),
    jobBoardController.getOrganizationJobsStats,
  );

  return router;
}
