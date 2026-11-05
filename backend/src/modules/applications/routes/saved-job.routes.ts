import { Router } from "express";
import type { SavedJobController } from "../controllers/saved-job.controller";
import type { ProfileGuards } from "@/modules/user-profile";
import validate from "@/middleware/validation.middleware";
import { getUserSavedJobsQuerySchema } from "@/validations/user.validation";
import { getJobSchema } from "@/validations/job.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";
import {
  cacheKeys,
  userScopedPattern,
} from "@shared/infrastructure/cache-keys";

export function createSavedJobRoutes({
  controller,
  profileGuards,
}: {
  controller: SavedJobController;
  profileGuards: ProfileGuards;
}): Router {
  const router = Router();

  // GET /users/me/saved-jobs
  router.get(
    "/me/saved-jobs",
    profileGuards.requireUserRole,
    validate(getUserSavedJobsQuerySchema),
    cacheMiddleware({ ttl: 300 }),
    controller.getSavedJobsForCurrentUser,
  );

  // GET /users/me/saved-jobs/:jobId/check
  router.get(
    "/me/saved-jobs/:jobId/check",
    profileGuards.requireUserRole,
    validate(getJobSchema),
    controller.checkIfJobIsSaved,
  );

  // POST /users/me/saved-jobs/:jobId
  router.post(
    "/me/saved-jobs/:jobId",
    profileGuards.requireUserRole,
    validate(getJobSchema),
    invalidateCacheMiddleware((req) =>
      userScopedPattern(cacheKeys.userSavedJobs, req.userId),
    ),
    // Job listing/detail payloads carry the viewer's `isSaved` flag, but a
    // save only changes THIS user's flag — evict only their `jobs*` entries
    // (anonymous and other users' cached payloads are unaffected).
    invalidateCacheMiddleware((req) =>
      userScopedPattern(cacheKeys.jobs, req.userId),
    ),
    controller.saveJobForCurrentUser,
  );

  // DELETE /users/me/saved-jobs/:jobId
  router.delete(
    "/me/saved-jobs/:jobId",
    profileGuards.requireUserRole,
    validate(getJobSchema),
    invalidateCacheMiddleware((req) =>
      userScopedPattern(cacheKeys.userSavedJobs, req.userId),
    ),
    invalidateCacheMiddleware((req) =>
      userScopedPattern(cacheKeys.jobs, req.userId),
    ),
    controller.unsaveJobForCurrentUser,
  );

  return router;
}
