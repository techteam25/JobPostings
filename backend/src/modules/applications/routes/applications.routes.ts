import { Router, type RequestHandler } from "express";
import { ApplicationsController } from "@/modules/applications";
import { ApplicationsService } from "@/modules/applications";
import type { ApplicationsGuards } from "@/modules/applications";
import type { ProfileGuards } from "@/modules/user-profile";
import type { OrganizationsGuards } from "@/modules/organizations";
import validate from "@/middleware/validation.middleware";
import { getJobSchema } from "@/validations/job.validation";
import {
  applyForJobSchema,
  updateApplicationStatusSchema,
  getJobApplicationSchema,
} from "@/validations/jobApplications.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";
import { uploadMiddleware } from "@/middleware/multer.middleware";
import type { ApplicationsRepositoryPort } from "@/modules/applications";
import type { OrgMembershipQueryPort } from "@/modules/applications/ports/org-membership-query.port";
import type { ApplicantQueryPort } from "@/modules/applications/ports/applicant-query.port";
import type { JobDetailsQueryPort } from "@/modules/applications/ports/job-details-query.port";
import type { EventBusPort } from "@shared/events";

export function createApplicationsRoutes({
  authenticate,
  profileGuards,
  orgGuards,
  appGuards,
  applicationsRepository,
  orgMembershipQuery,
  applicantQuery,
  jobDetailsQuery,
  eventBus,
}: {
  authenticate: RequestHandler;
  profileGuards: Pick<ProfileGuards, "requireUserRole">;
  orgGuards: Pick<OrganizationsGuards, "requireJobPostingRole">;
  appGuards: ApplicationsGuards;
  applicationsRepository: ApplicationsRepositoryPort;
  orgMembershipQuery: OrgMembershipQueryPort;
  applicantQuery: ApplicantQueryPort;
  jobDetailsQuery: JobDetailsQueryPort;
  eventBus: EventBusPort;
}): Router {
  const router = Router();

  const applicationsService = new ApplicationsService(
    applicationsRepository,
    jobDetailsQuery,
    orgMembershipQuery,
    applicantQuery,
    eventBus,
  );
  const applicationsController = new ApplicationsController(
    applicationsService,
  );

  // User routes (require authentication)

  // GET /jobs/me/applications — must be registered before /:jobId routes
  router.get(
    "/me/applications",
    authenticate,
    profileGuards.requireUserRole,
    cacheMiddleware({ ttl: 300 }),
    applicationsController.getUserApplications,
  );

  // POST /jobs/:jobId/apply
  router.post(
    "/:jobId/apply",
    authenticate,
    profileGuards.requireUserRole,
    uploadMiddleware.jobApplication,
    validate(applyForJobSchema),
    applicationsController.applyForJob,
  );

  // PATCH /jobs/applications/:applicationId/withdraw
  router.patch(
    "/applications/:applicationId/withdraw",
    authenticate,
    validate(getJobApplicationSchema),
    profileGuards.requireUserRole,
    appGuards.ensureApplicationOwnership,
    applicationsController.withdrawApplication,
  );

  // Employer routes (require authentication + job posting role)

  // GET /jobs/:jobId/applications
  router.get(
    "/:jobId/applications",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(getJobSchema),
    cacheMiddleware({ ttl: 300 }),
    applicationsController.getJobApplications,
  );

  // PATCH /jobs/applications/:applicationId/status
  router.patch(
    "/applications/:applicationId/status",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(updateApplicationStatusSchema),
    invalidateCacheMiddleware((_req) => `/api/jobs/me/applications`),
    applicationsController.updateApplicationStatus,
  );

  return router;
}
