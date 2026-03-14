import { Router, type RequestHandler } from "express";

import { OrganizationsService } from "../services/organizations.service";
import { OrganizationsController } from "../controllers/organizations.controller";
import type { OrganizationsGuards } from "@/modules/organizations";
import { uploadMiddleware } from "@/middleware/multer.middleware";
import validate from "@/middleware/validation.middleware";
import {
  createOrganizationSchema,
  updateOrganizationInputSchema,
  getOrganizationSchema,
  deleteOrganizationSchema,
  uploadOrganizationLogoSchema,
} from "@/validations/organization.validation";
import { getUserSchema } from "@/validations/user.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";
import type { OrganizationsRepositoryPort } from "../ports/organizations-repository.port";

export function createOrganizationsRoutes({
  authenticate,
  orgGuards,
  organizationsRepository,
}: {
  authenticate: RequestHandler;
  orgGuards: Pick<OrganizationsGuards, "requireAdminOrOwnerRole" | "ensureIsOrganizationMember">;
  organizationsRepository: OrganizationsRepositoryPort;
}): Router {
  const router = Router();

  const organizationsService = new OrganizationsService(
    organizationsRepository,
  );
  const organizationsController = new OrganizationsController(
    organizationsService,
  );

  // ─── Public routes ────────────────────────────────────────────────

  /**
   * Retrieves all organizations with pagination and search.
   * @route GET /
   */
  router.get(
    "/",
    cacheMiddleware({ ttl: 300 }),
    organizationsController.getAllOrganizations,
  );

  /**
   * Retrieves an organization by its ID, including members.
   * @route GET /:organizationId
   */
  router.get(
    "/:organizationId",
    validate(getOrganizationSchema),
    cacheMiddleware({ ttl: 300 }),
    organizationsController.getOrganizationById,
  );

  /**
   * Retrieves the organization ID for a given member ID.
   * @route GET /members/:id
   */
  router.get(
    "/members/:id",
    validate(getUserSchema),
    cacheMiddleware({ ttl: 600 }),
    organizationsController.getOrganizationIdByMemberId,
  );

  // ─── Authenticated routes ─────────────────────────────────────────

  /**
   * Creates a new organization.
   * Requires authentication.
   * @route POST /
   */
  router.post(
    "/",
    authenticate,
    uploadMiddleware.organizationLogo,
    validate(createOrganizationSchema),
    invalidateCacheMiddleware(() => "/organizations"),
    invalidateCacheMiddleware(() => "users/me/intent"),
    organizationsController.createOrganization,
  );

  /**
   * Uploads or updates the logo for a specific organization.
   * Requires authentication and owner role.
   * @route POST /:organizationId/logo
   */
  router.post(
    "/:organizationId/logo",
    authenticate,
    orgGuards.requireAdminOrOwnerRole(["owner"]),
    uploadMiddleware.organizationLogo,
    validate(uploadOrganizationLogoSchema),
    invalidateCacheMiddleware(
      (req) => `/organizations/${req.params.organizationId}`,
    ),
    organizationsController.uploadOrganizationLogo,
  );

  /**
   * Updates an existing organization.
   * Requires authentication and owner role.
   * @route PUT /:organizationId
   */
  router.put(
    "/:organizationId",
    authenticate,
    orgGuards.requireAdminOrOwnerRole(["owner"]),
    validate(updateOrganizationInputSchema),
    orgGuards.ensureIsOrganizationMember,
    invalidateCacheMiddleware(() => "/organizations"),
    invalidateCacheMiddleware(
      (req) => `/organizations/${req.params.organizationId}`,
    ),
    organizationsController.updateOrganization,
  );

  /**
   * Deletes an organization.
   * Requires authentication and owner role.
   * @route DELETE /:organizationId
   */
  router.delete(
    "/:organizationId",
    authenticate,
    orgGuards.requireAdminOrOwnerRole(["owner"]),
    validate(deleteOrganizationSchema),
    orgGuards.ensureIsOrganizationMember,
    invalidateCacheMiddleware(() => "/organizations"),
    invalidateCacheMiddleware(
      (req) => `/organizations/${req.params.organizationId}`,
    ),
    organizationsController.deleteOrganization,
  );

  return router;
}
