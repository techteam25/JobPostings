import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { IdentityServicePort } from "@/modules/identity";
import type {
  ChangePasswordSchema,
  DeleteSelfSchema,
  DeleteUserSchema,
  GetUserSchema,
} from "@/validations/user.validation";
import type { UpdateUser, User } from "@/validations/userProfile.validation";
import type { BetterAuthSuccessResponseSchema } from "@/validations/auth.validation";

export class IdentityController extends BaseController {
  constructor(private identityService: IdentityServicePort) {
    super();
  }

  updateUser = async (
    req: Request<GetUserSchema["params"], {}, UpdateUser>,
    res: Response,
  ) => {
    const id = Number(req.params.id);
    const updateData = req.body;
    const user = await this.identityService.updateUser(id, updateData);

    if (user.isSuccess) {
      return this.sendSuccess<User>(
        res,
        user.value,
        "User updated successfully",
      );
    } else {
      return this.handleControllerError(res, user.error);
    }
  };

  changePassword = async (
    req: Request<{}, {}, ChangePasswordSchema["body"]>,
    res: Response,
  ) => {
    const { currentPassword, newPassword } = req.body;

    const result = await this.identityService.changePassword(
      req.userId!,
      currentPassword,
      newPassword,
    );

    if (result.isSuccess) {
      return this.sendSuccess<{
        message: string;
        data: BetterAuthSuccessResponseSchema;
      }>(res, result.value, "Password changed successfully");
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deactivateSelf = async (req: Request, res: Response) => {
    const result = await this.identityService.deactivateSelf(req.userId!);

    if (result.isSuccess) {
      return this.sendSuccess<User>(
        res,
        result.value,
        "Account deactivated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deactivateUser = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const result = await this.identityService.deactivateUser(id, req.userId!);

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "User deactivated successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  activateUser = async (
    req: Request<GetUserSchema["params"]>,
    res: Response,
  ) => {
    const id = Number(req.params.id);

    const result = await this.identityService.activateUser(id);

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, "User activated successfully");
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deleteSelf = async (
    req: Request<{}, {}, DeleteSelfSchema["body"]>,
    res: Response,
  ) => {
    const { currentPassword } = req.body;

    const result = await this.identityService.deleteSelf(
      req.userId!,
      currentPassword,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Account deleted successfully", 204);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  deleteUser = async (
    req: Request<GetUserSchema["params"], {}, DeleteUserSchema["body"]>,
    res: Response,
  ) => {
    const { token } = req.body;

    await this.identityService.deleteUser(token);
    return this.sendSuccess(res, null, "User deleted successfully", 200);
  };
}
