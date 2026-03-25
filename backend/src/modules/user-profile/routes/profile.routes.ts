import { Router } from "express";
import type { ProfileController } from "../controllers/profile.controller";
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
  batchCreateEducationsSchema,
  updateEducationRouteSchema,
  deleteEducationRouteSchema,
} from "@/validations/educations.validation";
import {
  batchCreateWorkExperiencesSchema,
  updateWorkExperienceRouteSchema,
  deleteWorkExperienceRouteSchema,
} from "@/validations/workExperiences.validation";
import {
  linkCertificationSchema,
  unlinkCertificationSchema,
  searchCertificationsSchema,
} from "@/validations/certifications.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";

export function createProfileRoutes({
  controller: profileController,
  profileGuards,
  identityGuards,
  orgGuards,
}: {
  controller: ProfileController;
  profileGuards: ProfileGuards;
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

  // Education CRUD routes

  // POST /users/me/educations/batch
  router.post(
    "/me/educations/batch",
    validate(batchCreateEducationsSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.batchCreateEducations,
  );

  // PUT /users/me/educations/:educationId
  router.put(
    "/me/educations/:educationId",
    validate(updateEducationRouteSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.updateEducation,
  );

  // DELETE /users/me/educations/:educationId
  router.delete(
    "/me/educations/:educationId",
    validate(deleteEducationRouteSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.deleteEducation,
  );

  // Work Experience CRUD routes

  // POST /users/me/work-experiences/batch
  router.post(
    "/me/work-experiences/batch",
    validate(batchCreateWorkExperiencesSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.batchCreateWorkExperiences,
  );

  // PUT /users/me/work-experiences/:workExperienceId
  router.put(
    "/me/work-experiences/:workExperienceId",
    validate(updateWorkExperienceRouteSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.updateWorkExperience,
  );

  // DELETE /users/me/work-experiences/:workExperienceId
  router.delete(
    "/me/work-experiences/:workExperienceId",
    validate(deleteWorkExperienceRouteSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.deleteWorkExperience,
  );

  // Certification routes

  // GET /users/me/certifications/search?q=
  router.get(
    "/me/certifications/search",
    validate(searchCertificationsSchema),
    profileController.searchCertifications,
  );

  // POST /users/me/certifications
  router.post(
    "/me/certifications",
    validate(linkCertificationSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.linkCertification,
  );

  // DELETE /users/me/certifications/:certificationId
  router.delete(
    "/me/certifications/:certificationId",
    validate(unlinkCertificationSchema),
    invalidateCacheMiddleware(() => "users/me"),
    profileController.unlinkCertification,
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
