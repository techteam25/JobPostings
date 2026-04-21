import { Router, type RequestHandler } from "express";
import type { ApplicationsController } from "../controllers/applications.controller";
import type { OrganizationsGuards } from "@/modules/organizations";
import validate from "@/middleware/validation.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";
import { auditRead } from "@/middleware/audit-read.middleware";
import {
  jobApplicationManagementSchema,
  jobApplicationsManagementSchema,
  getOrganizationSchema,
  updateJobStatusInputSchema,
  createJobApplicationNoteSchema,
} from "@/validations/organization.validation";

/**
 * Creates routes for employer/organization-scoped application management.
 * These routes are mounted under /api/organizations and handle the employer
 * view of job applications (viewing, status updates, notes).
 */
export function createOrgApplicationsRoutes({
  authenticate,
  orgGuards,
  controller,
}: {
  authenticate: RequestHandler;
  orgGuards: Pick<
    OrganizationsGuards,
    "requireJobPostingRole" | "ensureIsOrganizationMember"
  >;
  controller: ApplicationsController;
}): Router {
  const router = Router();

  // GET /:organizationId/jobs/:jobId/applications
  router.get(
    "/:organizationId/jobs/:jobId/applications",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(jobApplicationsManagementSchema),
    cacheMiddleware({ ttl: 300 }),
    controller.getJobApplicationsForOrganization,
  );

  // GET /:organizationId/jobs/:jobId/applications/:applicationId
  router.get(
    "/:organizationId/jobs/:jobId/applications/:applicationId",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    auditRead("read.application.by_employer", (req) => ({
      type: "application",
      id: String(req.params.applicationId),
    })),
    validate(jobApplicationManagementSchema),
    cacheMiddleware({ ttl: 300 }),
    controller.getJobApplicationForOrganization,
  );

  // PATCH /:organizationId/jobs/:jobId/applications/:applicationId/status
  router.patch(
    "/:organizationId/jobs/:jobId/applications/:applicationId/status",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(updateJobStatusInputSchema),
    invalidateCacheMiddleware(() => `/api/jobs/me/applications`),
    controller.updateOrgJobApplicationStatus,
  );

  // POST /:organizationId/jobs/:jobId/applications/:applicationId/notes
  router.post(
    "/:organizationId/jobs/:jobId/applications/:applicationId/notes",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(createJobApplicationNoteSchema),
    controller.attachNoteToJobApplication,
  );

  // GET /:organizationId/jobs/:jobId/applications/:applicationId/notes
  router.get(
    "/:organizationId/jobs/:jobId/applications/:applicationId/notes",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(jobApplicationManagementSchema),
    cacheMiddleware({ ttl: 300 }),
    controller.getNotesForJobApplication,
  );

  // GET /:organizationId/applications
  router.get(
    "/:organizationId/applications",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(getOrganizationSchema),
    cacheMiddleware({ ttl: 300 }),
    controller.getApplicationsForOrganization,
  );

  return router;
}
