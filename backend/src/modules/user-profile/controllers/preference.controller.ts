import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { PreferenceServicePort } from "@/modules/user-profile";
import type { JobPreference } from "@/modules/user-profile";
import type { JobPreferenceWithWorkAreas } from "../ports/preference-service.port";
import type { PatchJobPreferenceBody } from "@/validations/jobPreference.validation";
import type { ApiResponse, EmptyBody } from "@shared/types";

export class PreferenceController extends BaseController {
  constructor(private preferenceService: PreferenceServicePort) {
    super();
  }

  getJobPreferences = async (
    req: Request,
    res: Response<ApiResponse<JobPreferenceWithWorkAreas | null>>,
  ) => {
    const result = await this.preferenceService.getJobPreferences(req.userId!);

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Job preferences retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  updateJobPreferences = async (
    req: Request<EmptyBody, EmptyBody, PatchJobPreferenceBody>,
    res: Response<ApiResponse<JobPreference>>,
  ) => {
    const result = await this.preferenceService.updateJobPreferences(
      req.userId!,
      req.body,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Job preferences updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
