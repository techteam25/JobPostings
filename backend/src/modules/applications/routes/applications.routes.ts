import { Router, type RequestHandler } from "express";
import type { ApplicationsController } from "../controllers/applications.controller";
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
import { cacheKeys } from "@shared/infrastructure/cache-keys";
import { uploadMiddleware } from "@/middleware/multer.middleware";

export function createApplicationsRoutes({
  authenticate,
  profileGuards,
  orgGuards,
  appGuards,
  controller,
}: {
  authenticate: RequestHandler;
  profileGuards: Pick<ProfileGuards, "requireUserRole">;
  orgGuards: Pick<OrganizationsGuards, "requireJobPostingRole">;
  appGuards: ApplicationsGuards;
  controller: ApplicationsController;
}): Router {
  const router = Router();

  // User routes (require authentication)

  // GET /jobs/me/applications — must be registered before /:jobId routes
  router.get(
    "/me/applications",
    authenticate,
    profileGuards.requireUserRole,
    cacheMiddleware({ ttl: 300 }),
    controller.getUserApplications,
  );

  // POST /jobs/:jobId/apply
  router.post(
    "/:jobId/apply",
    authenticate,
    profileGuards.requireUserRole,
    uploadMiddleware.jobApplication,
    validate(applyForJobSchema),
    controller.applyForJob,
  );

  // PATCH /jobs/applications/:applicationId/withdraw
  router.patch(
    "/applications/:applicationId/withdraw",
    authenticate,
    validate(getJobApplicationSchema),
    profileGuards.requireUserRole,
    appGuards.ensureApplicationOwnership,
    controller.withdrawApplication,
  );

  // Employer routes (require authentication + job posting role)

  // GET /jobs/:jobId/applications
  router.get(
    "/:jobId/applications",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(getJobSchema),
    cacheMiddleware({ ttl: 300 }),
    controller.getJobApplications,
  );

  // PATCH /jobs/applications/:applicationId/status
  router.patch(
    "/applications/:applicationId/status",
    authenticate,
    orgGuards.requireJobPostingRole(),
    validate(updateApplicationStatusSchema),
    // This route's path has no :jobId/:organizationId, so only the seeker's
    // own list can be targeted here. The org-scoped employer views are
    // invalidated by the org status route (org-applications.routes.ts).
    invalidateCacheMiddleware(() => cacheKeys.seekerApplications),
    controller.updateApplicationStatus,
  );

  return router;
}
