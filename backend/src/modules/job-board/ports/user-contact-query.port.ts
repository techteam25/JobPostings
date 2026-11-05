/**
 * Cross-module port for job-board to retrieve basic user contact info.
 * Used when sending job deletion notification emails.
 *
 * Implemented by IdentityToJobBoardAdapter in src/shared/adapters/.
 */
export interface UserContactQueryPort {
  getUserContactInfo(
    userId: number,
  ): Promise<{ email: string; fullName: string } | null>;
}
