import fs from "fs";
import path from "path";

import nodemailer from "nodemailer";
import { BaseService } from "@/services/base.service";
import { env } from "@/config/env";
import { AppError } from "@/utils/errors";
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
}
