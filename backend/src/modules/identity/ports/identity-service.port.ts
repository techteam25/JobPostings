import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type { UpdateUser } from "@/validations/userProfile.validation";

export interface IdentityServicePort {
  updateUser(
    id: number,
    updateData: UpdateUser,
  ): Promise<Result<any, AppError>>;

  changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<Result<{ message: string; data: any }, AppError>>;

  deactivateSelf(userId: number): Promise<Result<any, AppError>>;

  deactivateUser(
    id: number,
    requestingUserId: number,
  ): Promise<Result<any, AppError>>;

  activateUser(id: number): Promise<Result<any, AppError>>;

  deleteSelf(userId: number, token: string): Promise<Result<null, AppError>>;
}
