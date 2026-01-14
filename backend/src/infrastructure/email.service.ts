import fs from "fs";
import path from "path";

import nodemailer from "nodemailer";
import { BaseService } from "@/services/base.service";
import { env } from "@/config/env";
import { AppError } from "@/utils/errors";
import { getApplicationStatusLabel } from "@/utils/application-status";
import { EmailType } from "@/types";
import { UserRepository } from "@/repositories/user.repository";

/**
 * Service for handling email operations, including sending various types of emails.
 */
export class EmailService extends BaseService {
  private transporter: nodemailer.Transporter;
  private userRepository: UserRepository;

  /**
   * Creates an instance of EmailService and initializes the email transporter.
   */
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      // dkim: {
      //   domainName: "getinvolved.team", // domain
      //   keySelector: "default, // e.g., 'default' or '2026'
      //   privateKey: privateKey, // Private key string
      // },
    });
    this.userRepository = new UserRepository();
  }

  /**
   * Loads an HTML email template from the file system.
   * @param templateName The name of the template file (without extension).
   * @returns The template content as a string.
   */
  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(
      __dirname,
      "..",
      "email-templates",
      `${templateName}.html`,
    );
    return fs.promises.readFile(templatePath, "utf-8");
  }

  /**
   * Converts an image file to a base64 encoded string for embedding in emails.
   * @param imageName The name of the image file.
   * @returns The base64 encoded image string.
   */
  private async getImageAsBase64(imageName: string): Promise<string> {
    const logoPath = path.join(__dirname, "..", "assets", imageName);

    const logoBuffer = await fs.promises.readFile(logoPath);
    const base64Logo = logoBuffer.toString("base64");
    const mimeType = "image/png";

    return `data:${mimeType};base64,${base64Logo}`;
  }

  /**
   * Checks if an email can be sent to a user based on their preferences.
   * @param userId The ID of the user.
   * @param emailType The type of email to check.
   * @returns True if the email can be sent, false otherwise.
   */
  private async canSendEmail(
    userId: number,
    emailType: EmailType,
  ): Promise<boolean> {
    try {
      const emailTypeKey = emailType as
        | "jobMatchNotifications"
        | "applicationStatusNotifications"
        | "savedJobUpdates"
        | "weeklyJobDigest"
        | "monthlyNewsletter"
        | "marketingEmails"
        | "accountSecurityAlerts";

      return await this.userRepository.canSendEmailType(userId, emailTypeKey);
    } catch (error) {
      return true;
    }
  }

  /**
   * Generates an email footer with unsubscribe link and company information.
   * @param userId The ID of the user.
   * @param emailType The type of email being sent.
   * @returns HTML string for the email footer.
   */
  private async generateEmailFooter(
    userId: number,
    emailType: EmailType,
  ): Promise<string> {
    let unsubscribeLink: string | null = null;

    try {
      const preferences =
        await this.userRepository.findEmailPreferencesByUserId(userId);
      if (preferences) {
        unsubscribeLink = `${env.SERVER_URL}/api/users/me/email-preferences/unsubscribe/${preferences.unsubscribeToken}`;
      }
    } catch (error) {
      // If we can't get preferences, just don't include unsubscribe link
    }

    const preferencesLink = `${env.FRONTEND_URL}/settings/email-preferences`;
    const isSecurityAlert = emailType === EmailType.SECURITY_ALERT;

    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p style="margin: 10px 0;">
          This email was sent to you by GetInvolved.
        </p>
        ${
          !isSecurityAlert && unsubscribeLink
            ? `
        <p style="margin: 10px 0;">
          <a href="${preferencesLink}" style="color: #0066cc; text-decoration: none;">Manage email preferences</a> | 
          <a href="${unsubscribeLink}" style="color: #0066cc; text-decoration: none;">Unsubscribe</a>
        </p>
        `
            : ""
        }
        ${
          isSecurityAlert
            ? `
        <p style="margin: 10px 0; font-style: italic;">
          This is a security alert and cannot be unsubscribed from.
        </p>
        `
            : ""
        }
        <p style="margin: 10px 0;">
          © ${new Date().getFullYear()} GetInvolved. All rights reserved.
        </p>
      </div>
    `;
  }

  /**
   * Sends an account deactivation confirmation email to the user.
   * @param userId The ID of the user.
   * @param email The recipient's email address.
   * @param firstName The recipient's first name.
   */
  async sendAccountDeactivationConfirmation(
    userId: number,
    email: string,
    firstName: string,
  ): Promise<void> {
    try {
      const footer = await this.generateEmailFooter(
        userId,
        EmailType.SECURITY_ALERT,
      );

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Account Deactivation Confirmation",
        text: `Dear ${firstName},

Your account has been successfully deactivated. If you did not initiate this action, please contact support immediately.

Best regards,
Tech Team`,
        html: `<p>Dear ${firstName},</p>
<p>Your account has been successfully deactivated. If you did not initiate this action, please contact support immediately.</p>
<p>Best regards,<br>Tech Team</p>
${footer}`,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      if (error instanceof Error) {
        this.handleError(error);
      } else {
        this.handleError(
          new AppError("Unknown error occurred while sending email"),
        );
      }
    }
  }

  /**
   * Sends an account deletion confirmation email to the user.
   * @param userId The ID of the user.
   * @param email The recipient's email address.
   * @param firstName The recipient's first name.
   */
  async sendAccountDeletionConfirmation(
    userId: number,
    email: string,
    firstName: string,
  ): Promise<void> {
    try {
      const footer = await this.generateEmailFooter(
        userId,
        EmailType.SECURITY_ALERT,
      );

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Account Deletion Confirmation",
        text: `Dear ${firstName},

Your account has been successfully deleted. If you did not initiate this action, please contact support immediately.

Best regards,
Tech Team`,
        html: `<p>Dear ${firstName},</p>
<p>Your account has been successfully deleted. If you did not initiate this action, please contact support immediately.</p>
<p>Best regards,<br>Tech Team</p>
${footer}`,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      if (error instanceof Error) {
        this.handleError(error);
      } else {
        this.handleError(
          new AppError("Unknown error occurred while sending email"),
        );
      }
    }
  }

  /**
   * Sends an email verification link to the user.
   * @param email The recipient's email address.
   * @param name The recipient's name.
   * @param token The verification token.
   */
  async sendEmailVerification(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const template = await this.loadTemplate("verificationEmail");

    const verificationLink = `${env.SERVER_URL}/api/auth/verify-email?token=${token}&callbackURL=${env.FRONTEND_URL}/`;
    const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

    const htmlContent = template
      .replace("{{name}}", name)
      .replace("{{verificationLink}}", verificationLink)
      .replace("{{logoPath}}", logoPath);
    try {
      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Verify your email address",
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Sends an email verification for account deletion.
   * @param email The recipient's email address.
   * @param name The recipient's name.
   * @param url The verification URL.
   * @param token The verification token.
   */
  async sendDeleteAccountEmailVerification(
    email: string,
    name: string,
    url: string,
    token: string,
  ): Promise<void> {
    const template = await this.loadTemplate("deleteEmail");

    // const verificationLink = `${env.SERVER_URL}/api/auth/delete-user?token=${token}&callbackURL=${env.FRONTEND_URL}/`;
    const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

    const htmlContent = template
      .replace("{{name}}", name)
      .replace("{{verificationLink}}", url)
      .replace("{{logoPath}}", logoPath);
    try {
      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Account deletion request",
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Sends a job application confirmation email to the user.
   * @param userId The ID of the user.
   * @param email The recipient's email address.
   * @param fullName The recipient's full name.
   * @param jobTitle The title of the job applied for.
   */
  async sendJobApplicationConfirmation(
    userId: number,
    email: string,
    fullName: string,
    jobTitle: string,
  ): Promise<void> {
    try {
      const canSend = await this.canSendEmail(
        userId,
        EmailType.APPLICATION_STATUS,
      );
      if (!canSend) {
        return;
      }

      const template = await this.loadTemplate("jobApplicationConfirmation");

      const dashboardLink = `${env.FRONTEND_URL}/applications`;
      const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");
      const footer = await this.generateEmailFooter(
        userId,
        EmailType.APPLICATION_STATUS,
      );

      const htmlContent = template
        .replace("{{name}}", fullName)
        .replace("{{jobTitle}}", jobTitle)
        .replace("{{dashboardLink}}", dashboardLink)
        .replace("{{logoPath}}", logoPath)
        .replace("</body>", `${footer}</body>`);

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Application Submitted Successfully",
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Sends an application withdrawal confirmation email to the user.
   * @param userId The ID of the user.
   * @param email The recipient's email address.
   * @param fullName The recipient's full name.
   * @param jobTitle The title of the job.
   */
  async sendApplicationWithdrawalConfirmation(
    userId: number,
    email: string,
    fullName: string,
    jobTitle: string,
  ): Promise<void> {
    try {
      const canSend = await this.canSendEmail(
        userId,
        EmailType.APPLICATION_STATUS,
      );
      if (!canSend) {
        return;
      }

      const template = await this.loadTemplate(
        "applicationWithdrawalConfirmation",
      );

      const dashboardLink = `${env.FRONTEND_URL}/applications`;
      const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");
      const footer = await this.generateEmailFooter(
        userId,
        EmailType.APPLICATION_STATUS,
      );

      const htmlContent = template
        .replace("{{name}}", fullName)
        .replace("{{jobTitle}}", jobTitle)
        .replace("{{dashboardLink}}", dashboardLink)
        .replace("{{logoPath}}", logoPath)
        .replace("</body>", `${footer}</body>`);

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Application Withdrawn Successfully",
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Sends a job deletion confirmation email to the user.
   * @param userEmail The recipient's email address.
   * @param userName The recipient's name.
   * @param jobTitle The title of the deleted job.
   * @param jobId The ID of the deleted job.
   */
  async sendJobDeletionEmail(
    userEmail: string,
    userName: string,
    jobTitle: string,
    jobId: number,
  ): Promise<void> {
    try {
      const template = await this.loadTemplate("deleteEmail");
      const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

      const htmlContent = template
        .replace(/{{userName}}/g, userName)
        .replace(/{{jobTitle}}/g, jobTitle)
        .replace(/{{jobId}}/g, jobId.toString())
        .replace(/{{deletionDate}}/g, new Date().toLocaleDateString())
        .replace("{{logoPath}}", logoPath);

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: userEmail,
        subject: "Job Posting Deleted Successfully",
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  }

  /**
<<<<<<< HEAD
   * Sends an organization invitation email to the invitee.
   * @param email The recipient's email address.
   * @param organizationName The name of the organization.
   * @param inviterName The name of the person sending the invitation.
   * @param role The role being assigned.
   * @param token The invitation token.
   * @param expirationDate The expiration date of the invitation.
   */
  async sendOrganizationInvitation(
    email: string,
    organizationName: string,
    inviterName: string,
    role: string,
    token: string,
    expirationDate: string,
  ): Promise<void> {
    const template = await this.loadTemplate("organizationInvitation");

    const acceptanceLink = `${env.FRONTEND_URL}/invitations/accept?token=${token}`;
    const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

    // Format role for display (capitalize first letter)
    const roleDisplay =
      role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    const htmlContent = template
      .replace(/{{logoPath}}/g, logoPath)
      .replace(/{{organizationName}}/g, organizationName)
      .replace(/{{inviterName}}/g, inviterName)
      .replace(/{{role}}/g, roleDisplay)
      .replace(/{{acceptanceLink}}/g, acceptanceLink)
      .replace(/{{expirationDate}}/g, expirationDate);

    try {
      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: `Invitation to join ${organizationName} on getInvolved`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Sends a welcome email to a new organization member.
   * @param email The recipient's email address.
   * @param name The recipient's name.
   * @param organizationName The name of the organization.
   * @param role The role assigned to the member.
   */
  async sendOrganizationWelcome(
    email: string,
    name: string,
    organizationName: string,
    role: string,
  ): Promise<void> {
    const template = await this.loadTemplate("organizationWelcome");

    const dashboardLink = `${env.FRONTEND_URL}/dashboard`;
    const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

    // Format role for display (capitalize first letter)
    const roleDisplay =
      role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    const htmlContent = template
      .replace(/{{logoPath}}/g, logoPath)
      .replace(/{{name}}/g, name)
      .replace(/{{organizationName}}/g, organizationName)
      .replace(/{{role}}/g, roleDisplay)
      .replace(/{{dashboardLink}}/g, dashboardLink);

    try {
      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: `Welcome to ${organizationName} on getInvolved!`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Sends an application status update notification email to the applicant.
   * @param email The recipient's email address.
   * @param fullName The recipient's full name.
   * @param jobTitle The title of the job.
   * @param oldStatus The previous status of the application.
   * @param newStatus The new status of the application.
   */
  async sendApplicationStatusUpdate(
    email: string,
    fullName: string,
    jobTitle: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    try {
      const template = await this.loadTemplate("applicationStatusUpdate");

      const dashboardLink = `${env.FRONTEND_URL}/applications`;
      const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

      // Generate status-specific messages
      const statusMessages: Record<string, { message: string; nextSteps: string }> = {
        reviewed: {
          message: "Your application has been reviewed by the employer. They are currently evaluating your qualifications.",
          nextSteps: "The employer will continue to review your application and may contact you for next steps. Please check your email regularly for updates.",
        },
        shortlisted: {
          message: "Great news! Your application has been shortlisted. The employer is interested in learning more about you.",
          nextSteps: "The employer may contact you soon for an interview or additional information. Make sure to check your email and be prepared to discuss your qualifications.",
        },
        interviewing: {
          message: "Congratulations! You've been selected for an interview. The employer will contact you with details about the interview process.",
          nextSteps: "Please check your email for interview details and be prepared to discuss your experience and qualifications. Good luck!",
        },
        rejected: {
          message: "We regret to inform you that your application was not selected for this position at this time.",
          nextSteps: "Don't be discouraged! Continue to apply for other positions that match your skills and experience. We wish you the best in your job search.",
        },
        hired: {
          message: "Congratulations! You've been selected for this position. The employer will contact you with next steps.",
          nextSteps: "The employer will reach out to you with details about onboarding and your start date. Congratulations on your new opportunity!",
        },
        pending: {
          message: "Your application status has been updated to pending.",
          nextSteps: "The employer is reviewing your application. We will notify you when there are any updates.",
        },
        withdrawn: {
          message: "Your application has been withdrawn.",
          nextSteps: "If you have any questions about this action, please contact the employer or our support team.",
        },
      };

      const statusInfo = statusMessages[newStatus.toLowerCase()] || {
        message: `Your application status has been updated from ${oldStatus} to ${newStatus}.`,
        nextSteps: "Please check your dashboard for more details about your application.",
      };

      // Get human-readable status labels
      const oldStatusLabel = getApplicationStatusLabel(oldStatus);
      const newStatusLabel = getApplicationStatusLabel(newStatus);

      const htmlContent = template
        .replace("{{name}}", fullName)
        .replace("{{jobTitle}}", jobTitle)
        .replace("{{oldStatus}}", oldStatusLabel)
        .replace("{{newStatusRaw}}", newStatus.toLowerCase()) // Raw status for CSS classes
        .replace("{{newStatusLabel}}", newStatusLabel) // Human-readable label for display
        .replace("{{statusMessage}}", statusInfo.message)
        .replace("{{nextStepsMessage}}", statusInfo.nextSteps)
        .replace("{{dashboardLink}}", dashboardLink)
        .replace("{{logoPath}}", logoPath);

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: `Application Status Update: ${jobTitle}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Sends a job alert notification email with matched jobs.
   * @param userId The ID of the user.
   * @param email The user's email address.
   * @param fullName The user's full name.
   * @param alertName The name of the job alert.
   * @param matches Array of matched jobs with details.
   * @param totalMatches Total number of matches found.
   */
  async sendJobAlertNotification(
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
  ): Promise<void> {
    try {
      // Check if user has email preferences enabled for job matches
      const canSend = await this.canSendEmail(userId, EmailType.JOB_MATCH);
      if (!canSend) {
        console.log(
          `User ${userId} has disabled job match notifications, skipping email`,
        );
        return;
      }

      const template = await this.loadTemplate("jobAlertNotification");
      const logoPath = await this.getImageAsBase64("logo.png");
      const footer = await this.generateEmailFooter(userId, EmailType.JOB_MATCH);

      // Build job matches HTML
      const jobsHtml = matches
        .map(
          (match) => `
        <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">
            <a href="${env.FRONTEND_URL}/jobs/${match.job.id}" style="color: #0066cc; text-decoration: none;">
              ${match.job.title}
            </a>
          </h3>
          <p style="margin: 5px 0; color: #666;">
            <strong>${match.job.company}</strong>
            ${match.job.location ? ` • ${match.job.location}` : ""}
          </p>
          ${
            match.job.jobType || match.job.experienceLevel
              ? `
          <p style="margin: 5px 0; color: #666; font-size: 14px;">
            ${match.job.jobType ? `${match.job.jobType}` : ""}
            ${match.job.jobType && match.job.experienceLevel ? " • " : ""}
            ${match.job.experienceLevel ? `${match.job.experienceLevel}` : ""}
          </p>
          `
              : ""
          }
          ${
            match.job.description
              ? `
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            ${match.job.description.substring(0, 200)}${match.job.description.length > 200 ? "..." : ""}
          </p>
          `
              : ""
          }
          <a href="${env.FRONTEND_URL}/jobs/${match.job.id}" 
             style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">
            View Job
          </a>
        </div>
      `,
        )
        .join("");

      const moreMatchesText =
        totalMatches > matches.length
          ? `<p style="margin: 20px 0; color: #666; font-size: 14px;">
               And ${totalMatches - matches.length} more match${totalMatches - matches.length > 1 ? "es" : ""}!
             </p>`
          : "";

      const htmlContent = template
        .replace("{{name}}", fullName)
        .replace("{{alertName}}", alertName)
        .replace("{{matchCount}}", totalMatches.toString())
        .replace(
          "{{matchWord}}",
          totalMatches === 1 ? "match" : "matches",
        )
        .replace("{{jobsHtml}}", jobsHtml)
        .replace("{{moreMatchesText}}", moreMatchesText)
        .replace("{{alertsLink}}", `${env.FRONTEND_URL}/job-alerts`)
        .replace("{{logoPath}}", logoPath)
        .replace("{{footer}}", footer);

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: `${totalMatches} New Job ${totalMatches === 1 ? "Match" : "Matches"} for "${alertName}"`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send job alert notification", error);
    }
  }
}
