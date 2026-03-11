import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { NotificationsServicePort } from "../ports/notifications-service.port";
import type { ProfileServicePort } from "@/modules/user-profile/ports/profile-service.port";
import type {
  UserEmailPreferencesSchema,
  UpdateUserEmailPreferences,
  UnsubscribeEmailPreferences,
  UnsubscribeByContext,
  UpdateGranularPreference,
  GetUnsubscribeLandingPage,
} from "@/validations/user.validation";
import type { ApiResponse } from "@shared/types";
import { ValidationError } from "@shared/errors";
import type {
  CreateJobAlert,
  GetJobAlert,
  GetUserJobAlertsQuery,
  JobAlert,
  UpdateJobAlert,
  DeleteJobAlert,
  TogglePauseJobAlert,
} from "@/validations/jobAlerts.validation";

export class NotificationsController extends BaseController {
  constructor(
    private notificationsService: NotificationsServicePort,
    private profileService: ProfileServicePort,
  ) {
    super();
  }

  getEmailPreferences = async (
    req: Request,
    res: Response<UserEmailPreferencesSchema>,
  ) => {
    const result = await this.notificationsService.getEmailPreferences(
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess<UserEmailPreferencesSchema>(
        res,
        result.value,
        "Email preferences retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  updateEmailPreferences = async (
    req: Request<{}, {}, UpdateUserEmailPreferences["body"]>,
    res: Response,
  ) => {
    const preferences = req.body;

    if (preferences.accountSecurityAlerts === false) {
      return this.sendError(
        res,
        new ValidationError("Security alerts cannot be disabled"),
      );
    }

    const result = await this.notificationsService.updateEmailPreferences(
      req.userId!,
      preferences,
    );

    if (result.isSuccess) {
      return this.sendSuccess<UserEmailPreferencesSchema>(
        res,
        result.value,
        "Email preferences updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  unsubscribeByToken = async (
    req: Request<
      UnsubscribeEmailPreferences["params"],
      {},
      UserEmailPreferencesSchema
    >,
    res: Response,
  ) => {
    const { token } = req.params;
    const preferences = req.body;

    const result = await this.notificationsService.unsubscribeByToken(
      token,
      preferences,
    );

    if (result.isSuccess) {
      return this.sendSuccess<UserEmailPreferencesSchema>(
        res,
        result.value,
        "Successfully unsubscribed from email notifications",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  resubscribeEmailNotifications = async (req: Request, res: Response) => {
    const result =
      await this.notificationsService.resubscribeEmailNotifications(
        req.userId!,
      );

    if (result.isSuccess) {
      return this.sendSuccess<UserEmailPreferencesSchema>(
        res,
        result.value,
        "Successfully resubscribed to email notifications",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  createJobAlert = async (
    req: Request<{}, {}, CreateJobAlert["body"]>,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const alertData = req.body;
    const userId = req.userId!;

    const result = await this.notificationsService.createJobAlert(
      userId,
      alertData,
    );

    if (result.isSuccess) {
      return this.sendSuccess<JobAlert>(
        res,
        result.value,
        "Job alert created successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  getUserJobAlerts = async (
    req: Request<{}, {}, GetUserJobAlertsQuery["query"]>,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const userId = req.userId!;

    const result = await this.notificationsService.getUserJobAlerts(
      userId,
      page,
      limit,
    );

    if (result.isSuccess) {
      return this.sendPaginatedResponse<JobAlert>(
        res,
        result.value.items,
        result.value.pagination,
        "Job alerts retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  getJobAlertById = async (
    req: Request<GetJobAlert["params"]>,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const alertId = Number(req.params.id);
    const userId = req.userId!;

    const result = await this.notificationsService.getJobAlertById(
      userId,
      alertId,
    );

    if (result.isSuccess) {
      return this.sendSuccess<JobAlert>(
        res,
        result.value,
        "Job alert retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  updateJobAlert = async (
    req: Request<UpdateJobAlert["params"], {}, UpdateJobAlert["body"]>,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const alertId = Number(req.params.id);
    const userId = req.userId!;
    const updateData = req.body;

    const result = await this.notificationsService.updateJobAlert(
      userId,
      alertId,
      updateData,
    );

    if (result.isSuccess) {
      return this.sendSuccess<JobAlert>(
        res,
        result.value,
        "Job alert updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deleteJobAlert = async (
    req: Request<DeleteJobAlert["params"]>,
    res: Response<ApiResponse<null>>,
  ) => {
    const alertId = Number(req.params.id);
    const userId = req.userId!;

    const result = await this.notificationsService.deleteJobAlert(
      userId,
      alertId,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Job alert deleted successfully", 204);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  togglePauseJobAlert = async (
    req: Request<
      TogglePauseJobAlert["params"],
      {},
      TogglePauseJobAlert["body"]
    >,
    res: Response<ApiResponse<JobAlert>>,
  ) => {
    const alertId = Number(req.params.id);
    const userId = req.userId!;
    const { isPaused } = req.body;

    const result = await this.notificationsService.togglePauseJobAlert(
      userId,
      alertId,
      isPaused,
    );

    if (result.isSuccess) {
      return this.sendSuccess<JobAlert>(
        res,
        result.value,
        `Job alert ${isPaused ? "paused" : "resumed"} successfully`,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  unsubscribeByContext = async (
    req: Request<{}, {}, UnsubscribeByContext["body"]>,
    res: Response,
  ) => {
    const userId = req.userId!;
    const { context } = req.body;

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result = await this.notificationsService.unsubscribeByContext(
      userId,
      context,
      "account_settings",
      metadata,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        `Successfully unsubscribed from ${context.replace("_", " ")} emails`,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  resubscribeByContext = async (
    req: Request<{}, {}, UnsubscribeByContext["body"]>,
    res: Response,
  ) => {
    const userId = req.userId!;
    const { context } = req.body;

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result = await this.notificationsService.resubscribeByContext(
      userId,
      context,
      metadata,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        `Successfully re-subscribed to ${context.replace("_", " ")} emails`,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  updateGranularEmailPreference = async (
    req: Request<{}, {}, UpdateGranularPreference["body"]>,
    res: Response,
  ) => {
    const userId = req.userId!;
    const { preferenceType, enabled, context } = req.body;

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result =
      await this.notificationsService.updateEmailPreferenceWithAudit(
        userId,
        preferenceType,
        enabled,
        context,
        "account_settings",
        metadata,
      );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Email preference updated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  getUnsubscribeLandingPageData = async (
    req: Request<GetUnsubscribeLandingPage["params"]>,
    res: Response,
  ) => {
    const { token } = req.params;

    const prefsResult =
      await this.notificationsService.findEmailPreferencesByToken(token);

    if (prefsResult.isSuccess && prefsResult.value) {
      const userResult = await this.profileService.getUserById(
        prefsResult.value.userId,
      );

      if (userResult.isSuccess && userResult.value) {
        return this.sendSuccess(res, {
          user: {
            name: userResult.value.fullName,
            email: userResult.value.email,
          },
          preferences: prefsResult.value,
          token,
        });
      }
    }

    return this.handleControllerError(
      res,
      new Error("Invalid or expired unsubscribe token"),
    );
  };
}
