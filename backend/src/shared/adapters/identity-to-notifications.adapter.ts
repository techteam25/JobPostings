import type { IdentityRepositoryPort } from "@/modules/identity";
import type { UserActivityQueryPort } from "@/modules/notifications";

/**
 * Adapter bridging the identity repository into the notifications module's
 * UserActivityQueryPort. Provides user activity and contact information
 * for alert management without coupling notifications to identity internals.
 */
export class IdentityToNotificationsAdapter implements UserActivityQueryPort {
  constructor(private readonly identityRepository: IdentityRepositoryPort) {}

  async getInactiveUserIds(): Promise<number[]> {
    return this.identityRepository.findDeactivatedUserIds();
  }

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
