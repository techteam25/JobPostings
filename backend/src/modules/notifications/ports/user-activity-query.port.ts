/**
 * Port for querying user activity status from the notifications module's perspective.
 * The notifications module needs to know which users are inactive (deactivated)
 * so it can pause their job alerts, and needs contact info for notification delivery.
 *
 * Implemented by an adapter in src/shared/adapters/.
 */
export interface UserActivityQueryPort {
  getInactiveUserIds(): Promise<number[]>;
  getUserContactInfo(
    userId: number,
  ): Promise<{ email: string; fullName: string } | null>;
}
