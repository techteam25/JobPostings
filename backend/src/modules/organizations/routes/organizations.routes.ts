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
import { cacheKeys } from "@shared/infrastructure/cache-keys";

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
    invalidateCacheMiddleware(() => cacheKeys.organizations),
    invalidateCacheMiddleware(() => cacheKeys.userIntent),
    // Creating an org adds a membership to the user's org list.
    invalidateCacheMiddleware(() => cacheKeys.userOrganizations),
    controller.createOrganization,
  );

  /**
   * Uploads or updates the logo for a specific organization.
   * Requires authentication and owner role.
   * @route POST /:organizationId/logo
   */
  // No cache invalidation here — the upload is async (BullMQ worker).
  // Invalidating now would cause the frontend to re-cache stale data
  // since the worker hasn't updated the DB yet. The worker invalidates
  // the "organizations/{id}" cache pattern after the DB update.
  router.post(
    "/:organizationId/logo",
    authenticate,
    orgGuards.requireAdminOrOwnerRole(["owner"]),
    uploadMiddleware.organizationLogo,
    validate(uploadOrganizationLogoSchema),
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
    // `organizations` prefix glob already covers the `organizations/<id>`
    // detail key. Also refresh members' org lists (name/logo changes show
    // there).
    invalidateCacheMiddleware(() => cacheKeys.organizations),
    invalidateCacheMiddleware(() => cacheKeys.userOrganizations),
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
    // `organizations` prefix glob already covers the `organizations/<id>`
    // detail key. Also drop the deleted org from members' org lists.
    invalidateCacheMiddleware(() => cacheKeys.organizations),
    invalidateCacheMiddleware(() => cacheKeys.userOrganizations),
    controller.deleteOrganization,
  );

  return router;
}
