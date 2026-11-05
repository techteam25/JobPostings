import { Router } from "express";
import type { EducationController } from "../controllers/education.controller";
import validate from "@/middleware/validation.middleware";
import {
  batchCreateEducationsSchema,
  updateEducationRouteSchema,
  deleteEducationRouteSchema,
} from "@/validations/educations.validation";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

export function createEducationRoutes({
  controller,
}: {
  controller: EducationController;
}): Router {
  const router = Router();

  // POST /users/me/educations/batch
  router.post(
    "/me/educations/batch",
    validate(batchCreateEducationsSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.batchCreateEducations,
  );

  // PUT /users/me/educations/:educationId
  router.put(
    "/me/educations/:educationId",
    validate(updateEducationRouteSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.updateEducation,
  );

  // DELETE /users/me/educations/:educationId
  router.delete(
    "/me/educations/:educationId",
    validate(deleteEducationRouteSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.deleteEducation,
  );

  return router;
}
