import { Router } from "express";
import type { WorkAreaController } from "../controllers/work-area.controller";
import validate from "@/middleware/validation.middleware";
import { updateWorkAreasSchema } from "@/validations/workArea.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";

export function createWorkAreaRoutes({
  controller,
}: {
  controller: WorkAreaController;
}): Router {
  const router = Router();

  // GET /users/me/job-preferences/work-areas
  router.get(
    "/me/job-preferences/work-areas",
    cacheMiddleware({ ttl: 300 }),
    controller.getAllWorkAreas,
  );

  // PUT /users/me/job-preferences/work-areas
  router.put(
    "/me/job-preferences/work-areas",
    validate(updateWorkAreasSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.updateWorkAreas,
  );

  return router;
}
