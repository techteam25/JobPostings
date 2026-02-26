import { Job as BullMqJob, UnrecoverableError } from "bullmq";
import { z } from "zod";
import { EmailService } from "@/infrastructure/email.service";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

import logger from "@/logger";

// ============================================================================
// Discriminated union schemas for each email job type
// ============================================================================

const baseEmailSchema = z.object({
  userId: z.number(),
  email: z.string().email(),
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
  email: z.string().email(),
  fullName: z.string(),
  organizationName: z.string(),
  inviterName: z.string(),
  role: z.string(),
  token: z.string(),
  expirationDate: z.string(),
});

const organizationWelcomeSchema = z.object({
  userId: z.number(),
  email: z.string().email(),
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

// Map of job names to their validation schemas
const emailJobSchemas = {
  sendWelcomeEmail: baseEmailSchema,
  sendPasswordResetEmail: baseEmailSchema,
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

type EmailJobName = keyof typeof emailJobSchemas;

// Generic job data type for BullMQ registration
type EmailJobData = Record<string, unknown>;

const emailService = new EmailService();

export async function processEmailJob(
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
    case "sendWelcomeEmail":
      // await emailService.sendWelcomeEmail(data);
      break;
    case "sendPasswordResetEmail":
      // await emailService.sendPasswordResetEmail(data);
      break;
    case "sendJobApplicationConfirmation": {
      const d = data as z.infer<typeof jobApplicationConfirmationSchema>;
      await emailService.sendJobApplicationConfirmation(
        d.userId,
        d.email,
        d.fullName,
        d.jobTitle,
      );
      break;
    }
    case "sendApplicationWithdrawalConfirmation": {
      const d = data as z.infer<typeof applicationWithdrawalSchema>;
      await emailService.sendApplicationWithdrawalConfirmation(
        d.userId,
        d.email,
        d.fullName,
        d.jobTitle,
      );
      break;
    }
    case "sendAccountDeletionConfirmation": {
      const d = data as z.infer<typeof baseEmailSchema>;
      await emailService.sendAccountDeletionConfirmation(
        d.userId,
        d.email,
        d.fullName,
      );
      break;
    }
    case "sendAccountDeactivationConfirmation": {
      const d = data as z.infer<typeof baseEmailSchema>;
      await emailService.sendAccountDeactivationConfirmation(
        d.userId,
        d.email,
        d.fullName,
      );
      break;
    }
    case "sendJobDeletionEmail": {
      const d = data as z.infer<typeof jobDeletionSchema>;
      await emailService.sendJobDeletionEmail(
        d.email,
        d.fullName,
        d.jobTitle,
        d.jobId,
      );
      break;
    }
    case "sendOrganizationInvitation": {
      const d = data as z.infer<typeof organizationInvitationSchema>;
      await emailService.sendOrganizationInvitation(
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
      const d = data as z.infer<typeof organizationWelcomeSchema>;
      await emailService.sendOrganizationWelcome(
        d.email,
        d.name,
        d.organizationName,
        d.role,
      );
      break;
    }
    case "sendApplicationStatusUpdate": {
      const d = data as z.infer<typeof applicationStatusUpdateSchema>;
      await emailService.sendApplicationStatusUpdate(
        d.email,
        d.fullName,
        d.jobTitle,
        d.oldStatus,
        d.newStatus,
      );
      break;
    }
    case "sendPasswordChangedEmail": {
      const d = data as z.infer<typeof baseEmailSchema>;
      await emailService.sendPasswordChangedEmail(d.email, d.fullName);
      break;
    }
    case "sendJobAlertNotification":
    case "job-alert-notification": {
      const d = data as z.infer<typeof jobAlertNotificationSchema>;
      await emailService.sendJobAlertNotification(
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
}

/**
 * Initialize Email Sender worker
 */
export function initializeEmailWorker(): void {
  queueService.registerWorker<EmailJobData, void>(
    QUEUE_NAMES.EMAIL_QUEUE,
    processEmailJob,
    {
      concurrency: 5, // Process 5 email jobs concurrently
      limiter: {
        max: 50, // Max 50 emails
        duration: 60000, // per minute
      },
    },
  );

  logger.info("Email worker initialized");
}
