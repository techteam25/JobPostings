import type { IdentityRepositoryPort } from "@/modules/identity/ports/identity-repository.port";
import type { ApplicantQueryPort } from "@/modules/applications/ports/applicant-query.port";

/**
 * Adapter bridging the identity repository into the applications module's
 * ApplicantQueryPort. Provides basic user details (email, name) for
 * application confirmation and notification emails without coupling
 * applications to identity internals.
 */
export class IdentityToApplicationsAdapter implements ApplicantQueryPort {
  constructor(
    private readonly identityRepository: IdentityRepositoryPort,
  ) {}

  async findById(
    userId: number,
  ): Promise<{ email: string; fullName: string } | undefined> {
    const user = await this.identityRepository.findById(userId);

    if (!user) {
      return undefined;
    }

    return { email: user.email, fullName: user.fullName };
  }
}
