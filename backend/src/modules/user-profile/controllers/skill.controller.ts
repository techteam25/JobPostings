import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { SkillServicePort } from "../ports/skill-service.port";
import type {
  LinkSkillInput,
  UnlinkSkillInput,
  SearchSkillsInput,
} from "@/validations/skills.validation";
import type { EmptyBody } from "@shared/types";

export class SkillController extends BaseController {
  constructor(private skillService: SkillServicePort) {
    super();
  }

  linkSkill = async (
    req: Request<EmptyBody, EmptyBody, LinkSkillInput["body"]>,
    res: Response,
  ) => {
    const result = await this.skillService.linkSkill(req.userId!, {
      name: req.body.skillName,
    });

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Skill linked successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  unlinkSkill = async (
    req: Request<UnlinkSkillInput["params"]>,
    res: Response,
  ) => {
    const skillId = Number(req.params.skillId);

    const result = await this.skillService.unlinkSkill(req.userId!, skillId);

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, "Skill unlinked successfully");
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  searchSkills = async (
    req: Request<EmptyBody, EmptyBody, EmptyBody, SearchSkillsInput["query"]>,
    res: Response,
  ) => {
    const result = await this.skillService.searchSkills(req.query.q);

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, "Skills found");
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
