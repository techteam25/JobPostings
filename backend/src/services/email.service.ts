import fs from "fs";
import path from "path";

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
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(
      __dirname,
      "..",
      "email-templates",
      `${templateName}.html`,
    );
    return fs.promises.readFile(templatePath, "utf-8");
  }

  private async getImageAsBase64(imageName: string): Promise<string> {
    const logoPath = path.join(__dirname, "..", "assets", imageName);

    const logoBuffer = await fs.promises.readFile(logoPath);
    const base64Logo = logoBuffer.toString("base64");
    const mimeType = "image/png";

    return `data:${mimeType};base64,${base64Logo}`;
  }

  async sendAccountDeactivationConfirmation(
    email: string,
    firstName: string,
  ): Promise<void> {
    try {
      const template = await this.loadTemplate("accountDeactivation");
      const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

      const htmlContent = template
        .replace("{{firstName}}", firstName)
        .replace("{{logoPath}}", logoPath);

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Account Deactivation Confirmation",
        html: htmlContent,
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
      const template = await this.loadTemplate("accountDeletionConfirmation");
      const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

      const htmlContent = template
        .replace("{{firstName}}", firstName)
        .replace("{{logoPath}}", logoPath);

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Account Deletion Confirmation",
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.handleError(error);
    }
  }

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

  async sendDeleteAccountEmailVerification(
    email: string,
    name: string,
    url: string,
    token: string,
  ): Promise<void> {
    const template = await this.loadTemplate("deleteEmail");

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

  async sendApplicationWithdrawalConfirmation(
    email: string,
    firstName: string,
    jobTitle: string,
    companyName: string,
  ): Promise<void> {
    try {
      const template = await this.loadTemplate("applicationWithdrawal");
      const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

      const htmlContent = template
        .replace("{{firstName}}", firstName)
        .replace("{{jobTitle}}", jobTitle)
        .replace("{{companyName}}", companyName)
        .replace("{{logoPath}}", logoPath);

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Application Withdrawal Confirmation",
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.handleError(error);
    }
  }

  async sendJobDeletionConfirmation(
    email: string,
    firstName: string,
    jobTitle: string,
    companyName: string,
  ): Promise<void> {
    try {
      const template = await this.loadTemplate("jobDeletionConfirmation");
      const logoPath = await this.getImageAsBase64("GetInvolved_Logo.png");

      const htmlContent = template
        .replace("{{firstName}}", firstName)
        .replace("{{jobTitle}}", jobTitle)
        .replace("{{companyName}}", companyName)
        .replace("{{logoPath}}", logoPath);

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Job Deletion Confirmation",
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.handleError(error);
    }
  }
}