import nodemailer from "nodemailer";
import { BaseService } from "./base.service";

export class EmailService extends BaseService {
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.example.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendAccountDeactivationConfirmation(email: string, firstName: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || "no-reply@yourapp.com",
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
}