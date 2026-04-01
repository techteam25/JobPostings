import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";

/**
 * Port for synchronous write operations against the Identity module.
 * Used by the user-profile module to update user-level fields (e.g. fullName)
 * that live on the `user` table, owned by the identity bounded context.
 *
 * Implemented by IdentityToProfileWriteAdapter in src/shared/adapters/.
 */
export interface IdentityWritePort {
  updateUserDisplayName(
    userId: number,
    fullName: string,
  ): Promise<Result<void, AppError>>;
}
