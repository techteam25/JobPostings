import { Router } from "express";
import type { SkillController } from "../controllers/skill.controller";
import validate from "@/middleware/validation.middleware";
import {
  linkSkillSchema,
  unlinkSkillSchema,
  searchSkillsSchema,
} from "@/validations/skills.validation";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

export function createSkillRoutes({
  controller,
}: {
  controller: SkillController;
}): Router {
  const router = Router();

  // GET /users/me/skills/search?q=
  router.get(
    "/me/skills/search",
    validate(searchSkillsSchema),
    controller.searchSkills,
  );

  // POST /users/me/skills
  router.post(
    "/me/skills",
    validate(linkSkillSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.linkSkill,
  );

  // DELETE /users/me/skills/:skillId
  router.delete(
    "/me/skills/:skillId",
    validate(unlinkSkillSchema),
    invalidateCacheMiddleware(() => "users/me"),
    controller.unlinkSkill,
  );

  return router;
}
