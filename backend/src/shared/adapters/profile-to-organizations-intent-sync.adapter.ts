import type { IdentityRepositoryPort } from "@/modules/identity";
import type { IntentSyncPort } from "@/modules/organizations";

/**
 * Adapter bridging the identity repository into the organizations module's
 * IntentSyncPort. Enables the organizations module to sync denormalized
 * intent/onboarding data to the user table after creating an organization.
 *
 * Routes through the identity module because the user table is owned by
 * the identity bounded context.
 */
export class ProfileToOrganizationsIntentSyncAdapter implements IntentSyncPort {
  constructor(
    private readonly identityRepository: Pick<
      IdentityRepositoryPort,
      "syncIntent"
    >,
  ) {}

  async syncIntentToUser(
    userId: number,
    intent: "seeker" | "employer",
    onboardingStatus: "pending" | "completed",
  ): Promise<void> {
    await this.identityRepository.syncIntent(userId, intent, onboardingStatus);
  }
}
