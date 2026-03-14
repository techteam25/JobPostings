import { Router } from "express";
import { JobBoardController } from "@/modules/job-board";
import { JobBoardService } from "@/modules/job-board";
import { AuthMiddleware } from "@/middleware/auth.middleware";
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
  authMiddleware,
  jobBoardRepository,
  jobInsightsRepository,
  typesenseService,
  organizationRepository,
  userRepository,
  applicationStatusQuery,
}: {
  authMiddleware: AuthMiddleware;
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
    authMiddleware.authenticate,
    authMiddleware.requireJobPostingRole(),
    cacheMiddleware({ ttl: 300 }),
    jobBoardController.getMyJobs,
  );

  // POST /jobs
  router.post(
    "/",
    authMiddleware.authenticate,
    authMiddleware.requireJobPostingRole(),
    validate(createJobSchema),
    invalidateCacheMiddleware((_req) => `/api/jobs`),
    jobBoardController.createJob,
  );

  // PUT /jobs/:jobId
  router.put(
    "/:jobId",
    authMiddleware.authenticate,
    authMiddleware.requireJobPostingRole(),
    validate(updateJobSchema),
    invalidateCacheMiddleware((_req) => `/api/jobs`),
    jobBoardController.updateJob,
  );

  // DELETE /jobs/:jobId
  router.delete(
    "/:jobId",
    authMiddleware.authenticate,
    authMiddleware.ensureJobOwnership,
    authMiddleware.requireDeleteJobPermission(),
    validate(deleteJobSchema),
    invalidateCacheMiddleware((_req) => `/api/jobs`),
    invalidateCacheMiddleware((req) => `/api/jobs/${req.params.jobId}`),
    jobBoardController.deleteJob,
  );

  // GET /jobs/employer/:organizationId/jobs
  router.get(
    "/employer/:organizationId/jobs",
    authMiddleware.authenticate,
    authMiddleware.requireJobPostingRole(),
    authMiddleware.ensureIsOrganizationMember,
    validate(getOrganizationSchema),
    cacheMiddleware({ ttl: 300 }),
    jobBoardController.getJobsByEmployer,
  );

  // GET /jobs/employer/:organizationId/jobs/stats
  router.get(
    "/employer/:organizationId/jobs/stats",
    authMiddleware.authenticate,
    authMiddleware.requireJobPostingRole(),
    authMiddleware.ensureIsOrganizationMember,
    validate(getOrganizationSchema),
    jobBoardController.getOrganizationJobsStats,
  );

  return router;
}
