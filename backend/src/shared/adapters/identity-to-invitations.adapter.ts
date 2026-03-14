import type { IdentityRepositoryPort } from "@/modules/identity/ports/identity-repository.port";
import type { UserEmailQueryPort } from "@/modules/invitations/ports/user-email-query.port";

/**
 * Adapter bridging the identity repository into the invitations module's
 * UserEmailQueryPort. Provides user name lookup for invitation emails
 * without coupling invitations to identity internals.
 */
export class IdentityToInvitationsAdapter implements UserEmailQueryPort {
  constructor(private readonly identityRepository: IdentityRepositoryPort) {}

  async getUserNameById(userId: number): Promise<string | null> {
    const user = await this.identityRepository.findUserById(userId);

    if (!user) {
      return null;
    }

    return user.fullName;
  }

  async getUserById(
    userId: number,
  ): Promise<{ email: string; fullName: string } | null> {
    const user = await this.identityRepository.findUserById(userId);

    if (!user) {
      return null;
    }

    return { email: user.email, fullName: user.fullName };
  }
}
