import { Router } from "express";
import type { CertificationController } from "../controllers/certification.controller";
import validate from "@/middleware/validation.middleware";
import {
  linkCertificationSchema,
  unlinkCertificationSchema,
  searchCertificationsSchema,
} from "@/validations/certifications.validation";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

export function createCertificationRoutes({
  controller,
}: {
  controller: CertificationController;
}): Router {
  const router = Router();

  // GET /users/me/certifications/search?q=
  router.get(
    "/me/certifications/search",
    validate(searchCertificationsSchema),
    controller.searchCertifications,
  );

  // POST /users/me/certifications
  router.post(
    "/me/certifications",
    validate(linkCertificationSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.linkCertification,
  );

  // DELETE /users/me/certifications/:certificationId
  router.delete(
    "/me/certifications/:certificationId",
    validate(unlinkCertificationSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.unlinkCertification,
  );

  return router;
}
