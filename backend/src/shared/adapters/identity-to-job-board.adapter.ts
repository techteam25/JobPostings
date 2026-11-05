import type { IdentityRepositoryPort } from "@/modules/identity";
import type { UserContactQueryPort } from "@/modules/job-board";

/**
 * Adapter bridging the identity repository into the job-board module's
 * UserContactQueryPort. Provides user contact info for job deletion
 * notification emails without coupling job-board to identity internals.
 */
export class IdentityToJobBoardAdapter implements UserContactQueryPort {
  constructor(private readonly identityRepository: IdentityRepositoryPort) {}

  async getUserContactInfo(
    userId: number,
  ): Promise<{ email: string; fullName: string } | null> {
    const user = await this.identityRepository.findUserById(userId);

    if (!user) {
      return null;
    }

    return {
      email: user.email,
      fullName: user.fullName,
    };
  }
}
