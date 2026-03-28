import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { WorkAreaServicePort } from "../ports/work-area-service.port";
import type { WorkArea } from "../ports/work-area-repository.port";
import type { UpdateWorkAreasBody } from "@/validations/workArea.validation";
import type { ApiResponse, EmptyBody } from "@shared/types";

export class WorkAreaController extends BaseController {
  constructor(private workAreaService: WorkAreaServicePort) {
    super();
  }

  getAllWorkAreas = async (
    _req: Request,
    res: Response<ApiResponse<WorkArea[]>>,
  ) => {
    const result = await this.workAreaService.getAllWorkAreas();

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Work areas retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  updateWorkAreas = async (
    req: Request<EmptyBody, EmptyBody, UpdateWorkAreasBody>,
    res: Response<ApiResponse<void>>,
  ) => {
    const result = await this.workAreaService.updateWorkAreas(
      req.userId!,
      req.body.workAreaIds,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Work areas updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
