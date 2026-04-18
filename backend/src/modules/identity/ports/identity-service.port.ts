import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import { UpdateUser, User } from "@/validations/userProfile.validation";

export interface IdentityServicePort {
  updateUser(
    id: number,
    updateData: UpdateUser,
  ): Promise<Result<User, AppError>>;

  deactivateSelf(userId: number): Promise<Result<User, AppError>>;

  deactivateUser(
    id: number,
    requestingUserId: number,
  ): Promise<Result<User, AppError>>;

  activateUser(id: number): Promise<Result<User | undefined, AppError>>;

  getBlockingOwnedOrgs(
    userId: number,
  ): Promise<Result<{ id: number; name: string }[], AppError>>;
}
