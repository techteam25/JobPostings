import { Router } from "express";
import type { WorkExperienceController } from "../controllers/work-experience.controller";
import validate from "@/middleware/validation.middleware";
import {
  batchCreateWorkExperiencesSchema,
  updateWorkExperienceRouteSchema,
  deleteWorkExperienceRouteSchema,
} from "@/validations/workExperiences.validation";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

export function createWorkExperienceRoutes({
  controller,
}: {
  controller: WorkExperienceController;
}): Router {
  const router = Router();

  // POST /users/me/work-experiences/batch
  router.post(
    "/me/work-experiences/batch",
    validate(batchCreateWorkExperiencesSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.batchCreateWorkExperiences,
  );

  // PUT /users/me/work-experiences/:workExperienceId
  router.put(
    "/me/work-experiences/:workExperienceId",
    validate(updateWorkExperienceRouteSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.updateWorkExperience,
  );

  // DELETE /users/me/work-experiences/:workExperienceId
  router.delete(
    "/me/work-experiences/:workExperienceId",
    validate(deleteWorkExperienceRouteSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.deleteWorkExperience,
  );

  return router;
}
