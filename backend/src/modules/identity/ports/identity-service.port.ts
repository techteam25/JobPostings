import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import { UpdateUser, User } from "@/validations/userProfile.validation";
import { BetterAuthSuccessResponseSchema } from "@/validations/auth.validation";

export interface IdentityServicePort {
  updateUser(
    id: number,
    updateData: UpdateUser,
  ): Promise<Result<User, AppError>>;

  changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<
    Result<{ message: string; data: BetterAuthSuccessResponseSchema }, AppError>
  >;

  deactivateSelf(userId: number): Promise<Result<User, AppError>>;

  deactivateUser(
    id: number,
    requestingUserId: number,
  ): Promise<Result<User, AppError>>;

  activateUser(id: number): Promise<Result<User | undefined, AppError>>;

  deleteSelf(userId: number, token: string): Promise<Result<null, AppError>>;

  deleteUser(token: string): Promise<Result<null, AppError>>;
}
