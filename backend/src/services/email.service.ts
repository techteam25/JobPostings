import nodemailer from "nodemailer";
import { BaseService } from "./base.service";
import { env } from "@/config/env";

export class EmailService extends BaseService {
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendAccountDeactivationConfirmation(
    email: string,
    firstName: string,
  ): Promise<void> {
    try {
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
<p>Best regards,<br>Tech Team</p>`,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.handleError(error);
    }
  }

  async sendAccountDeletionConfirmation(
    email: string,
    firstName: string,
  ): Promise<void> {
    try {
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
<p>Best regards,<br>Tech Team</p>`,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.handleError(error);
    }
  }
}
