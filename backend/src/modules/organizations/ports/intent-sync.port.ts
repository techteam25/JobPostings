/**
 * Port for syncing user intent/onboarding status to the user table.
 *
 * The organizations module needs to sync denormalized intent data after
 * creating an organization (which auto-completes employer onboarding).
 * The user-profile module owns this data — this port avoids a direct
 * cross-module write.
 *
 * Implemented by ProfileToOrganizationsIntentSyncAdapter in src/shared/adapters/.
 */
export interface IntentSyncPort {
  syncIntentToUser(
    userId: number,
    intent: "seeker" | "employer",
    onboardingStatus: "pending" | "completed",
  ): Promise<void>;
}
