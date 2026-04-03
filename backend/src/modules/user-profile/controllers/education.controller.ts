import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { EducationServicePort } from "../ports/education-service.port";
import type {
  BatchCreateEducationsInput,
  UpdateEducationRouteInput,
  DeleteEducationRouteInput,
} from "@/validations/educations.validation";
import type { EmptyBody } from "@shared/types";

export class EducationController extends BaseController {
  constructor(private educationService: EducationServicePort) {
    super();
  }

  batchCreateEducations = async (
    req: Request<EmptyBody, EmptyBody, BatchCreateEducationsInput["body"]>,
    res: Response,
  ) => {
    const { educations } = req.body;

    const result = await this.educationService.batchAddEducations(
      req.userId!,
      educations,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Education entries added successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  updateEducation = async (
    req: Request<
      UpdateEducationRouteInput["params"],
      EmptyBody,
      UpdateEducationRouteInput["body"]
    >,
    res: Response,
  ) => {
    const educationId = Number(req.params.educationId);

    const result = await this.educationService.updateEducation(
      educationId,
      req.body,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Education updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deleteEducation = async (
    req: Request<DeleteEducationRouteInput["params"]>,
    res: Response,
  ) => {
    const educationId = Number(req.params.educationId);

    const result = await this.educationService.deleteEducation(educationId);

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Education deleted successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
