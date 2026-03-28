import { Router } from "express";
import type { PreferenceController } from "../controllers/preference.controller";
import validate from "@/middleware/validation.middleware";
import { patchJobPreferenceSchema } from "@/validations/jobPreference.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";

export function createJobPreferenceRoutes({
  controller,
}: {
  controller: PreferenceController;
}): Router {
  const router = Router();

  // GET /users/me/job-preferences
  router.get(
    "/me/job-preferences",
    cacheMiddleware({ ttl: 300 }),
    controller.getJobPreferences,
  );

  // PATCH /users/me/job-preferences
  router.patch(
    "/me/job-preferences",
    validate(patchJobPreferenceSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.updateJobPreferences,
  );

  return router;
}
