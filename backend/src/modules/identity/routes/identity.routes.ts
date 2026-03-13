import { Router } from "express";
import { IdentityController } from "@/modules/identity";
import { IdentityRepository } from "@/modules/identity";
import { IdentityService } from "@/modules/identity";
import { EmailService } from "@shared/infrastructure/email.service";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "@/middleware/validation.middleware";
import {
  getUserSchema,
  updateUserPayloadSchema,
  deleteSelfSchema,
} from "@/validations/user.validation";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

export function createIdentityRoutes({
  authMiddleware,
  emailService,
}: {
  authMiddleware: AuthMiddleware;
  emailService: EmailService;
}): Router {
  const router = Router();

  const identityRepository = new IdentityRepository();
  const identityService = new IdentityService(identityRepository, emailService);
  const identityController = new IdentityController(identityService);

  // Current user identity routes (authenticated via parent router)

  // PATCH /users/me/deactivate
  router.patch(
    "/me/deactivate",
    invalidateCacheMiddleware(() => "users/me"),
    identityController.deactivateSelf,
  );

  // DELETE /users/me/delete
  router.delete(
    "/me/delete",
    validate(deleteSelfSchema),
    invalidateCacheMiddleware(() => "users/me"),
    identityController.deleteSelf,
  );

  // Admin routes for user management

  // PUT /users/:id
  router.put(
    "/:id",
    authMiddleware.requireOwnAccount,
    validate(updateUserPayloadSchema),
    identityController.updateUser,
  );

  // PATCH /users/:id/deactivate
  router.patch(
    "/:id/deactivate",
    validate(getUserSchema),
    authMiddleware.requireAdminOrOwnerRole(["admin", "owner"]),
    identityController.deactivateUser,
  );

  // PATCH /users/:id/activate
  router.patch(
    "/:id/activate",
    validate(getUserSchema),
    authMiddleware.requireAdminOrOwnerRole(["admin", "owner"]),
    identityController.activateUser,
  );

  // DELETE /users/:id
  router.delete(
    "/:id",
    validate(getUserSchema),
    authMiddleware.requireAdminOrOwnerRole(["owner"]),
    identityController.deleteUser,
  );

  return router;
}
