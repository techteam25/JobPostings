import { Router, type RequestHandler } from "express";
import { ApplicationsController } from "@/modules/applications";
import { ApplicationsService } from "@/modules/applications";
import type { OrganizationsGuards } from "@/modules/organizations";
import validate from "@/middleware/validation.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";
import {
  jobApplicationManagementSchema,
  jobApplicationsManagementSchema,
  getOrganizationSchema,
  updateJobStatusInputSchema,
  createJobApplicationNoteSchema,
} from "@/validations/organization.validation";
import type { ApplicationsRepositoryPort } from "@/modules/applications";
import type { JobDetailsQueryPort } from "@/modules/applications/ports/job-details-query.port";
import type { OrgMembershipQueryPort } from "@/modules/applications/ports/org-membership-query.port";
import type { ApplicantQueryPort } from "@/modules/applications/ports/applicant-query.port";
import type { EventBusPort } from "@shared/events";

/**
 * Creates routes for employer/organization-scoped application management.
 * These routes are mounted under /api/organizations and handle the employer
 * view of job applications (viewing, status updates, notes).
 */
export function createOrgApplicationsRoutes({
  authenticate,
  orgGuards,
  applicationsRepository,
  orgMembershipQuery,
  applicantQuery,
  jobDetailsQuery,
  eventBus,
}: {
  authenticate: RequestHandler;
  orgGuards: Pick<OrganizationsGuards, "requireJobPostingRole" | "ensureIsOrganizationMember">;
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

  // GET /:organizationId/jobs/:jobId/applications
  router.get(
    "/:organizationId/jobs/:jobId/applications",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(jobApplicationsManagementSchema),
    cacheMiddleware({ ttl: 300 }),
    applicationsController.getJobApplicationsForOrganization,
  );

  // GET /:organizationId/jobs/:jobId/applications/:applicationId
  router.get(
    "/:organizationId/jobs/:jobId/applications/:applicationId",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(jobApplicationManagementSchema),
    cacheMiddleware({ ttl: 300 }),
    applicationsController.getJobApplicationForOrganization,
  );

  // PATCH /:organizationId/jobs/:jobId/applications/:applicationId/status
  router.patch(
    "/:organizationId/jobs/:jobId/applications/:applicationId/status",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(updateJobStatusInputSchema),
    invalidateCacheMiddleware((_req) => `/api/jobs/me/applications`),
    applicationsController.updateOrgJobApplicationStatus,
  );

  // POST /:organizationId/jobs/:jobId/applications/:applicationId/notes
  router.post(
    "/:organizationId/jobs/:jobId/applications/:applicationId/notes",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(createJobApplicationNoteSchema),
    applicationsController.attachNoteToJobApplication,
  );

  // GET /:organizationId/jobs/:jobId/applications/:applicationId/notes
  router.get(
    "/:organizationId/jobs/:jobId/applications/:applicationId/notes",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(jobApplicationManagementSchema),
    cacheMiddleware({ ttl: 300 }),
    applicationsController.getNotesForJobApplication,
  );

  // GET /:organizationId/applications
  router.get(
    "/:organizationId/applications",
    authenticate,
    orgGuards.requireJobPostingRole(),
    orgGuards.ensureIsOrganizationMember,
    validate(getOrganizationSchema),
    cacheMiddleware({ ttl: 300 }),
    applicationsController.getApplicationsForOrganization,
  );

  return router;
}
