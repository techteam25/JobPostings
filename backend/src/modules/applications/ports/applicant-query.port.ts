/**
 * Port for querying applicant details from the applications module's
 * perspective. The applications module needs basic user info (email, name)
 * to send confirmation and notification emails after application events.
 *
 * Implemented by an adapter in src/shared/adapters/.
 */
export interface ApplicantQueryPort {
  findById(
    userId: number,
  ): Promise<{ email: string; fullName: string } | undefined>;
}
