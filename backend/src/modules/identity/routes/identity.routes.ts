import { Router } from "express";
import type { IdentityController } from "../controllers/identity.controller";
import type { IdentityGuards } from "@/modules/identity";
import type { OrganizationsGuards } from "@/modules/organizations";
import validate from "@/middleware/validation.middleware";
import {
  getUserSchema,
  updateUserPayloadSchema,
} from "@/validations/user.validation";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

export function createIdentityRoutes({
  controller: identityController,
  identityGuards,
  orgGuards,
}: {
  controller: IdentityController;
  identityGuards: IdentityGuards;
  orgGuards: Pick<OrganizationsGuards, "requireAdminOrOwnerRole">;
}): Router {
  const router = Router();

  // Current user identity routes (authenticated via parent router)

  // PATCH /users/me/deactivate
  router.patch(
    "/me/deactivate",
    invalidateCacheMiddleware(() => "users/me"),
    identityController.deactivateSelf,
  );

  // Admin routes for user management

  // PUT /users/:id
  router.put(
    "/:id",
    identityGuards.requireOwnAccount,
    validate(updateUserPayloadSchema),
    identityController.updateUser,
  );

  // PATCH /users/:id/deactivate
  router.patch(
    "/:id/deactivate",
    validate(getUserSchema),
    orgGuards.requireAdminOrOwnerRole(["admin", "owner"]),
    identityController.deactivateUser,
  );

  // PATCH /users/:id/activate
  router.patch(
    "/:id/activate",
    validate(getUserSchema),
    orgGuards.requireAdminOrOwnerRole(["admin", "owner"]),
    identityController.activateUser,
  );

  return router;
}
