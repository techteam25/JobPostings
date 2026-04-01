import type { IdentityRepositoryPort } from "@/modules/identity";
import type { IdentityWritePort } from "@/modules/user-profile";
import { DatabaseError } from "@shared/errors";
import { ok, fail, type Result } from "@shared/result";
import type { AppError } from "@shared/errors";

/**
 * Adapter bridging the identity repository into the user-profile module's
 * IdentityWritePort. Enables the user-profile module to update user-level
 * fields (e.g. fullName) that are owned by the identity bounded context.
 *
 * Uses the repository directly (not the service) because cross-module calls
 * lack HTTP session context required by auth.api methods.
 */
export class IdentityToProfileWriteAdapter implements IdentityWritePort {
  constructor(private readonly identityRepository: IdentityRepositoryPort) {}

  async updateUserDisplayName(
    userId: number,
    fullName: string,
  ): Promise<Result<void, AppError>> {
    const success = await this.identityRepository.updateFullName(
      userId,
      fullName,
    );

    if (!success) {
      return fail(new DatabaseError("Failed to update display name"));
    }

    return ok(undefined);
  }
}
