import { Router, type RequestHandler } from "express";

import type { OrganizationsController } from "../controllers/organizations.controller";
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

export function createOrganizationsRoutes({
  authenticate,
  orgGuards,
  controller,
}: {
  authenticate: RequestHandler;
  orgGuards: Pick<
    OrganizationsGuards,
    "requireAdminOrOwnerRole" | "ensureIsOrganizationMember"
  >;
  controller: OrganizationsController;
}): Router {
  const router = Router();

  // ─── Public routes ────────────────────────────────────────────────

  /**
   * Retrieves all organizations with pagination and search.
   * @route GET /
   */
  router.get(
    "/",
    cacheMiddleware({ ttl: 300 }),
    controller.getAllOrganizations,
  );

  /**
   * Retrieves an organization by its ID, including members.
   * @route GET /:organizationId
   */
  router.get(
    "/:organizationId",
    validate(getOrganizationSchema),
    cacheMiddleware({ ttl: 300 }),
    controller.getOrganizationById,
  );

  /**
   * Retrieves the organization ID for a given member ID.
   * @route GET /members/:id
   */
  router.get(
    "/members/:id",
    validate(getUserSchema),
    cacheMiddleware({ ttl: 600 }),
    controller.getOrganizationIdByMemberId,
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
    controller.createOrganization,
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
    controller.uploadOrganizationLogo,
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
    controller.updateOrganization,
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
    controller.deleteOrganization,
  );

  return router;
}
