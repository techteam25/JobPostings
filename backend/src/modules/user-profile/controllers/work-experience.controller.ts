import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { WorkExperienceServicePort } from "../ports/work-experience-service.port";
import type {
  BatchCreateWorkExperiencesInput,
  UpdateWorkExperienceRouteInput,
  DeleteWorkExperienceRouteInput,
} from "@/validations/workExperiences.validation";
import type { EmptyBody } from "@shared/types";

export class WorkExperienceController extends BaseController {
  constructor(private workExperienceService: WorkExperienceServicePort) {
    super();
  }

  batchCreateWorkExperiences = async (
    req: Request<EmptyBody, EmptyBody, BatchCreateWorkExperiencesInput["body"]>,
    res: Response,
  ) => {
    const { workExperiences } = req.body;

    const result = await this.workExperienceService.batchAddWorkExperiences(
      req.userId!,
      workExperiences,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Work experience entries added successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  updateWorkExperience = async (
    req: Request<
      UpdateWorkExperienceRouteInput["params"],
      EmptyBody,
      UpdateWorkExperienceRouteInput["body"]
    >,
    res: Response,
  ) => {
    const workExperienceId = Number(req.params.workExperienceId);

    const result = await this.workExperienceService.updateWorkExperience(
      workExperienceId,
      req.body,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Work experience updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deleteWorkExperience = async (
    req: Request<DeleteWorkExperienceRouteInput["params"]>,
    res: Response,
  ) => {
    const workExperienceId = Number(req.params.workExperienceId);

    const result =
      await this.workExperienceService.deleteWorkExperience(workExperienceId);

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Work experience deleted successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
