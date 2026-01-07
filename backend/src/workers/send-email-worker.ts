import { Job as BullMqJob } from "bullmq";
import { EmailService } from "@/infrastructure/email.service";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

import logger from "@/logger";

type EmailJobData = {
  email: string;
  fullName: string;
  [key: string]: unknown;
};

const emailService = new EmailService();

export async function processEmailJob(
  job: BullMqJob<EmailJobData>,
): Promise<void> {
  switch (job.name) {
    case "sendWelcomeEmail":
      // await emailService.sendWelcomeEmail(job.data);
      break;
    case "sendPasswordResetEmail":
      // await emailService.sendPasswordResetEmail(job.data);
      break;
    case "sendJobApplicationConfirmation":
      await emailService.sendJobApplicationConfirmation(
        job.data.email,
        job.data.fullName,
        job.data.jobTitle as string,
      );
      break;
    case "sendApplicationWithdrawalConfirmation":
      await emailService.sendApplicationWithdrawalConfirmation(
        job.data.email,
        job.data.fullName,
        job.data.jobTitle as string,
      );
      break;
    case "sendAccountDeletionConfirmation":
      const user = job.data;
      await emailService.sendAccountDeletionConfirmation(
        user.email,
        user.fullName,
      );
      break;
    case "sendAccountDeactivationConfirmation":
      await emailService.sendAccountDeactivationConfirmation(
        job.data.email,
        job.data.fullName,
      );
      break;
    case "sendJobDeletionEmail":
      await emailService.sendJobDeletionEmail(
        job.data.email,
        job.data.fullName,
        job.data.jobTitle as string,
        job.data.jobId as number,
      );
      break;
    case "sendApplicationStatusUpdate":
      await emailService.sendApplicationStatusUpdate(
        job.data.email,
        job.data.fullName,
        job.data.jobTitle as string,
        job.data.oldStatus as string,
        job.data.newStatus as string,
      );
      break;

    default:
      logger.error(`Unknown email job type: ${job.name}`);
  }
}

/**
 * Initialize Email Sender worker
 */
export function initializeEmailWorker(): void {
  queueService.registerWorker<EmailJobData & { correlationId: string }, void>(
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
