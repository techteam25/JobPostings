import { Job as BullMqJob, UnrecoverableError } from "bullmq";
import { z } from "zod";
import type { EmailServicePort } from "@shared/ports/email-service.port";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import logger from "@shared/logger";
import type { ModuleWorkers } from "@shared/types/module-workers";

// ============================================================================
// Discriminated union schemas for each email job type
// ============================================================================

const baseEmailSchema = z.object({
  userId: z.number(),
  email: z.email(),
  fullName: z.string(),
});

const jobApplicationConfirmationSchema = baseEmailSchema.extend({
  jobTitle: z.string(),
});

const applicationWithdrawalSchema = baseEmailSchema.extend({
  jobTitle: z.string(),
});

const jobDeletionSchema = baseEmailSchema.extend({
  jobTitle: z.string(),
  jobId: z.number(),
});

const organizationInvitationSchema = z.object({
  userId: z.number(),
  email: z.email(),
  fullName: z.string(),
  organizationName: z.string(),
  inviterName: z.string(),
  role: z.string(),
  token: z.string(),
  expirationDate: z.string(),
});

const organizationWelcomeSchema = z.object({
  userId: z.number(),
  email: z.email(),
  fullName: z.string(),
  name: z.string(),
  organizationName: z.string(),
  role: z.string(),
});

const applicationStatusUpdateSchema = baseEmailSchema.extend({
  jobTitle: z.string(),
  oldStatus: z.string(),
  newStatus: z.string(),
});

const jobAlertMatchSchema = z.object({
  job: z.object({
    id: z.number(),
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    jobType: z.string().optional(),
    experienceLevel: z.string().optional(),
    description: z.string().optional(),
  }),
  matchScore: z.number(),
});

const jobAlertNotificationSchema = baseEmailSchema.extend({
  alertName: z.string(),
  matches: z.array(jobAlertMatchSchema),
  totalMatches: z.number(),
});

const emailVerificationSchema = baseEmailSchema.extend({
  token: z.string(),
});

const deleteAccountEmailVerificationSchema = baseEmailSchema.extend({
  url: z.url(),
  token: z.string(),
});

export const emailJobSchemas = {
  sendWelcomeEmail: baseEmailSchema,
  sendEmailVerification: emailVerificationSchema,
  sendDeleteAccountEmailVerification: deleteAccountEmailVerificationSchema,
  sendPasswordResetEmail: baseEmailSchema.extend({
    resetUrl: z.url(),
  }),
  sendJobApplicationConfirmation: jobApplicationConfirmationSchema,
  sendApplicationWithdrawalConfirmation: applicationWithdrawalSchema,
  sendAccountDeletionConfirmation: baseEmailSchema,
  sendAccountDeactivationConfirmation: baseEmailSchema,
  sendJobDeletionEmail: jobDeletionSchema,
  sendOrganizationInvitation: organizationInvitationSchema,
  sendOrganizationWelcome: organizationWelcomeSchema,
  sendApplicationStatusUpdate: applicationStatusUpdateSchema,
  sendPasswordChangedEmail: baseEmailSchema,
  sendJobAlertNotification: jobAlertNotificationSchema,
  "job-alert-notification": jobAlertNotificationSchema,
} as const;

export type EmailJobName = keyof typeof emailJobSchemas;

export type EmailJobPayload<T extends EmailJobName> = z.infer<
  (typeof emailJobSchemas)[T]
>;

type EmailJobData = Record<string, unknown>;

interface SendEmailWorkerDeps {
  emailService: EmailServicePort;
}

function createEmailHandler(deps: SendEmailWorkerDeps) {
  return async function processEmailJob(
    job: BullMqJob<EmailJobData>,
  ): Promise<void> {
    const jobName = job.name as EmailJobName;
    const schema = emailJobSchemas[jobName];

    if (!schema) {
      throw new UnrecoverableError(`Unknown email job type: ${jobName}`);
    }

    const parsed = schema.safeParse(job.data);
    if (!parsed.success) {
      throw new UnrecoverableError(
        `Invalid email job data for ${jobName}: ${parsed.error.message}`,
      );
    }

    const data = parsed.data;

    switch (jobName) {
      case "sendWelcomeEmail": {
        const d = data as EmailJobPayload<"sendWelcomeEmail">;
        await deps.emailService.sendWelcomeEmail(d.userId, d.email, d.fullName);
        break;
      }
      case "sendEmailVerification": {
        const d = data as EmailJobPayload<"sendEmailVerification">;
        await deps.emailService.sendEmailVerification(
          d.email,
          d.fullName,
          d.token,
        );
        break;
      }
      case "sendDeleteAccountEmailVerification": {
        const d = data as EmailJobPayload<"sendDeleteAccountEmailVerification">;
        await deps.emailService.sendDeleteAccountEmailVerification(
          d.email,
          d.fullName,
          d.url,
          d.token,
        );
        break;
      }
      case "sendPasswordResetEmail": {
        const d = data as EmailJobPayload<"sendPasswordResetEmail">;
        await deps.emailService.sendPasswordResetEmail(
          d.email,
          d.fullName,
          d.resetUrl,
        );
        break;
      }
      case "sendJobApplicationConfirmation": {
        const d = data as EmailJobPayload<"sendJobApplicationConfirmation">;
        await deps.emailService.sendJobApplicationConfirmation(
          d.userId,
          d.email,
          d.fullName,
          d.jobTitle,
        );
        break;
      }
      case "sendApplicationWithdrawalConfirmation": {
        const d =
          data as EmailJobPayload<"sendApplicationWithdrawalConfirmation">;
        await deps.emailService.sendApplicationWithdrawalConfirmation(
          d.userId,
          d.email,
          d.fullName,
          d.jobTitle,
        );
        break;
      }
      case "sendAccountDeletionConfirmation": {
        const d = data as EmailJobPayload<"sendAccountDeletionConfirmation">;
        await deps.emailService.sendAccountDeletionConfirmation(
          d.userId,
          d.email,
          d.fullName,
        );
        break;
      }
      case "sendAccountDeactivationConfirmation": {
        const d =
          data as EmailJobPayload<"sendAccountDeactivationConfirmation">;
        await deps.emailService.sendAccountDeactivationConfirmation(
          d.userId,
          d.email,
          d.fullName,
        );
        break;
      }
      case "sendJobDeletionEmail": {
        const d = data as EmailJobPayload<"sendJobDeletionEmail">;
        await deps.emailService.sendJobDeletionEmail(
          d.email,
          d.fullName,
          d.jobTitle,
          d.jobId,
        );
        break;
      }
      case "sendOrganizationInvitation": {
        const d = data as EmailJobPayload<"sendOrganizationInvitation">;
        await deps.emailService.sendOrganizationInvitation(
          d.email,
          d.organizationName,
          d.inviterName,
          d.role,
          d.token,
          d.expirationDate,
        );
        break;
      }
      case "sendOrganizationWelcome": {
        const d = data as EmailJobPayload<"sendOrganizationWelcome">;
        await deps.emailService.sendOrganizationWelcome(
          d.email,
          d.name,
          d.organizationName,
          d.role,
        );
        break;
      }
      case "sendApplicationStatusUpdate": {
        const d = data as EmailJobPayload<"sendApplicationStatusUpdate">;
        await deps.emailService.sendApplicationStatusUpdate(
          d.email,
          d.fullName,
          d.jobTitle,
          d.oldStatus,
          d.newStatus,
        );
        break;
      }
      case "sendPasswordChangedEmail": {
        const d = data as EmailJobPayload<"sendPasswordChangedEmail">;
        await deps.emailService.sendPasswordChangedEmail(d.email, d.fullName);
        break;
      }
      case "sendJobAlertNotification":
      case "job-alert-notification": {
        const d = data as EmailJobPayload<"sendJobAlertNotification">;
        await deps.emailService.sendJobAlertNotification(
          d.userId,
          d.email,
          d.fullName,
          d.alertName,
          d.matches,
          d.totalMatches,
        );
        break;
      }
    }
  };
}

export function createSendEmailWorker(
  deps: SendEmailWorkerDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<EmailJobData, void>(
        QUEUE_NAMES.EMAIL_QUEUE,
        createEmailHandler(deps),
        {
          concurrency: 5,
          limiter: {
            max: 50,
            duration: 60000,
          },
        },
      );

      logger.info("Email worker initialized");
    },

    async scheduleJobs() {
      // Email worker has no scheduled jobs — emails are enqueued on demand
    },
  };
}
