import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import { UpdateUser, User } from "@/validations/userProfile.validation";
import type { WalkAwayClassification } from "./org-ownership-query.port";

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

  getWalkAwayOrgs(
    userId: number,
  ): Promise<Result<WalkAwayClassification, AppError>>;

  /**
   * Classify owned orgs; refuse when any block; otherwise tear down solo orgs.
   * Used by self-deactivate and the account before-delete hook.
   */
  prepareWalkAway(userId: number): Promise<Result<void, AppError>>;
}
