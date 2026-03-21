/**
 * Cross-module port for the invitations module to look up user
 * information (names and emails) without importing directly from the
 * identity or user-profile modules.
 */
export interface UserEmailQueryPort {
  /**
   * Gets a user's full name by their ID.
   * Returns null if the user does not exist.
   */
  getUserNameById(userId: number): Promise<string | null>;

  /**
   * Gets a user's email and full name by their ID.
   * Returns null if the user does not exist.
   * Used by InvitationsService to verify email matches when accepting invitations.
   */
  getUserById(
    userId: number,
  ): Promise<{ email: string; fullName: string } | null>;
}
