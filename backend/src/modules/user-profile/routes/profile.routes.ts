import { Router } from "express";
import type { ProfileController } from "../controllers/profile.controller";
import type { IdentityGuards } from "@/modules/identity";
import type { OrganizationsGuards } from "@/modules/organizations";
import validate from "@/middleware/validation.middleware";
import {
  getUserSchema,
  updateUserPayloadSchema,
  createUserPayloadSchema,
} from "@/validations/user.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";
import {
  updateWorkAvailabilitySchema,
  uploadProfilePictureSchema,
  uploadResumeSchema,
} from "@/validations/userProfile.validation";
import { uploadMiddleware } from "@/middleware/multer.middleware";

export function createProfileRoutes({
  controller: profileController,
  identityGuards,
  orgGuards,
}: {
  controller: ProfileController;
  identityGuards: Pick<IdentityGuards, "requireOwnAccount">;
  orgGuards: Pick<OrganizationsGuards, "requireAdminOrOwnerRole">;
}): Router {
  const router = Router();

  // Current user profile routes (authenticated via parent router)

  // GET /users/me
  router.get(
    "/me",
    cacheMiddleware({ ttl: 600 }),
    profileController.getCurrentUser,
  );

  // GET /users/me/status
  router.get("/me/status", profileController.getUserProfileStatus);

  // PATCH /users/me/visibility
  router.patch(
    "/me/visibility",
    invalidateCacheMiddleware(() => "users/me"),
    profileController.changeProfileVisibility,
  );

  // PATCH /users/me/availability
  router.patch(
    "/me/availability",
    validate(updateWorkAvailabilitySchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.changeWorkAvailability,
  );

  // GET /users/me/intent
  router.get(
    "/me/intent",
    cacheMiddleware({ ttl: 300 }),
    profileController.getCurrentUserIntent,
  );

  // PATCH /users/me/onboarding/complete
  router.patch(
    "/me/onboarding/complete",
    invalidateCacheMiddleware(() => "users/me/intent"),
    profileController.completeOnboarding,
  );

  // GET /users/me/organizations
  router.get(
    "/me/organizations",
    cacheMiddleware({ ttl: 300 }),
    profileController.getUserOrganizations,
  );

  // PUT /users/me/profile
  router.put(
    "/me/profile",
    validate(updateUserPayloadSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.updateProfile,
  );

  // POST /users/me/profile
  router.post(
    "/me/profile",
    validate(createUserPayloadSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.createProfile,
  );

  // POST /users/me/profile-picture
  // No cache invalidation here — the upload is async (BullMQ worker).
  // Invalidating now would cause the frontend to re-cache stale data
  // since the worker hasn't updated the DB yet.
  router.post(
    "/me/profile-picture",
    uploadMiddleware.profilePicture,
    validate(uploadProfilePictureSchema),
    profileController.uploadProfilePicture,
  );

  // POST /users/me/resume
  // No cache invalidation — async BullMQ worker (same reason as profile picture).
  router.post(
    "/me/resume",
    uploadMiddleware.resume,
    validate(uploadResumeSchema),
    profileController.uploadResume,
  );

  // DELETE /users/me/resume
  router.delete(
    "/me/resume",
    invalidateCacheMiddleware(() => "users/me"),
    profileController.deleteResume,
  );

  // Admin routes

  // GET /users (all users - admin)
  router.get(
    "/",
    orgGuards.requireAdminOrOwnerRole(["admin", "owner"]),
    profileController.getAllUsers,
  );

  // GET /users/:id
  router.get(
    "/:id",
    identityGuards.requireOwnAccount,
    validate(getUserSchema),
    profileController.getUserById,
  );

  return router;
}
