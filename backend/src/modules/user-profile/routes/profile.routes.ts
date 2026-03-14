import { Router } from "express";
import { ProfileController } from "@/modules/user-profile";
import { ProfileRepository } from "@/modules/user-profile";
import { ProfileService } from "@/modules/user-profile";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { OrganizationService } from "@/services/organization.service";
import type { ProfileGuards } from "@/modules/user-profile";
import type { IdentityGuards } from "@/modules/identity";
import type { OrganizationsGuards } from "@/modules/organizations";
import validate from "@/middleware/validation.middleware";
import {
  getUserSchema,
  updateUserPayloadSchema,
  createUserPayloadSchema,
  getUserSavedJobsQuerySchema,
} from "@/validations/user.validation";
import { getJobSchema } from "@/validations/job.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";

export function createProfileRoutes({
  profileGuards,
  identityGuards,
  orgGuards,
  organizationRepository,
  organizationService,
}: {
  profileGuards: ProfileGuards;
  identityGuards: Pick<IdentityGuards, "requireOwnAccount">;
  orgGuards: Pick<OrganizationsGuards, "requireAdminOrOwnerRole">;
  organizationRepository: OrganizationRepository;
  organizationService: OrganizationService;
}): Router {
  const router = Router();

  const profileRepository = new ProfileRepository();
  const profileService = new ProfileService(
    profileRepository,
    organizationRepository,
  );
  const profileController = new ProfileController(
    profileService,
    organizationService,
  );

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
  router.patch("/me/visibility", profileController.changeProfileVisibility);

  // GET /users/me/intent
  router.get(
    "/me/intent",
    cacheMiddleware({ ttl: 300 }),
    profileController.getCurrentUserIntent,
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

  // Saved jobs routes

  // GET /users/me/saved-jobs
  router.get(
    "/me/saved-jobs",
    profileGuards.requireUserRole,
    validate(getUserSavedJobsQuerySchema),
    cacheMiddleware({ ttl: 300 }),
    profileController.getSavedJobsForCurrentUser,
  );

  // GET /users/me/saved-jobs/:jobId/check
  router.get(
    "/me/saved-jobs/:jobId/check",
    profileGuards.requireUserRole,
    validate(getJobSchema),
    profileController.checkIfJobIsSaved,
  );

  // POST /users/me/saved-jobs/:jobId
  router.post(
    "/me/saved-jobs/:jobId",
    profileGuards.requireUserRole,
    validate(getJobSchema),
    invalidateCacheMiddleware(() => "users/me/saved-jobs"),
    profileController.saveJobForCurrentUser,
  );

  // DELETE /users/me/saved-jobs/:jobId
  router.delete(
    "/me/saved-jobs/:jobId",
    profileGuards.requireUserRole,
    validate(getJobSchema),
    invalidateCacheMiddleware(() => "users/me/saved-jobs"),
    profileController.unsaveJobForCurrentUser,
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
