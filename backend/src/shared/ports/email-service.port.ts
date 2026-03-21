export interface EmailServicePort {
  /**
   * Sends an email verification link to the user.
   */
  sendEmailVerification(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;

  /**
   * Sends a password changed confirmation email to the user.
   */
  sendPasswordChangedEmail(email: string, fullName: string): Promise<void>;

  /**
   * Sends a job application confirmation email to the user.
   */
  sendJobApplicationConfirmation(
    userId: number,
    email: string,
    fullName: string,
    jobTitle: string,
  ): Promise<void>;

  /**
   * Sends an application withdrawal confirmation email to the user.
   */
  sendApplicationWithdrawalConfirmation(
    userId: number,
    email: string,
    fullName: string,
    jobTitle: string,
  ): Promise<void>;

  /**
   * Sends a job deletion confirmation email to the user.
   */
  sendJobDeletionEmail(
    userEmail: string,
    userName: string,
    jobTitle: string,
    jobId: number,
  ): Promise<void>;

  /**
   * Sends an organization invitation email to the invitee.
   */
  sendOrganizationInvitation(
    email: string,
    organizationName: string,
    inviterName: string,
    role: string,
    token: string,
    expirationDate: string,
  ): Promise<void>;

  /**
   * Sends a welcome email to a new organization member.
   */
  sendOrganizationWelcome(
    email: string,
    name: string,
    organizationName: string,
    role: string,
  ): Promise<void>;

  /**
   * Sends an application status update notification email to the applicant.
   */
  sendApplicationStatusUpdate(
    email: string,
    fullName: string,
    jobTitle: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void>;

  /**
   * Sends a job alert notification email with matched jobs.
   */
  sendJobAlertNotification(
    userId: number,
    email: string,
    fullName: string,
    alertName: string,
    matches: Array<{
      job: {
        id: number;
        title: string;
        company: string;
        location?: string;
        jobType?: string;
        experienceLevel?: string;
        description?: string;
      };
      matchScore: number;
    }>,
    totalMatches: number,
  ): Promise<void>;

  /**
   * Sends an unsubscribe confirmation email to the user.
   */
  sendUnsubscribeConfirmation(
    email: string,
    name: string,
    context: "job_seeker" | "employer" | "global",
  ): Promise<void>;

  /**
   * Sends an account deactivation confirmation email to the user.
   */
  sendAccountDeactivationConfirmation(
    userId: number,
    email: string,
    firstName: string,
  ): Promise<void>;

  /**
   * Sends an account deletion confirmation email to the user.
   */
  sendAccountDeletionConfirmation(
    userId: number,
    email: string,
    firstName: string,
  ): Promise<void>;

  /**
   * Sends an email verification for account deletion.
   */
  sendDeleteAccountEmailVerification(
    email: string,
    name: string,
    url: string,
    token: string,
  ): Promise<void>;
}
