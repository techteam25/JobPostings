import { Job as BullMqJob } from "bullmq";
import { EmailService } from "@/infrastructure/email.service";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

import logger from "@/logger";

type EmailJobData = {
  userId: number;
  email: string;
  fullName: string;
  [key: string]: unknown;
};

const emailService = new EmailService();

export async function processEmailJob(
  job: BullMqJob<EmailJobData>,
): Promise<void> {
  const { userId } = job.data;

  if (!userId) {
    logger.error(`Email job missing userId for job: ${job.name}`);
    return;
  }

  switch (job.name) {
    case "sendWelcomeEmail":
      // await emailService.sendWelcomeEmail(job.data);
      break;
    case "sendPasswordResetEmail":
      // await emailService.sendPasswordResetEmail(job.data);
      break;
    case "sendJobApplicationConfirmation":
      await emailService.sendJobApplicationConfirmation(
        userId,
        job.data.email,
        job.data.fullName,
        job.data.jobTitle as string,
      );
      break;
    case "sendApplicationWithdrawalConfirmation":
      await emailService.sendApplicationWithdrawalConfirmation(
        userId,
        job.data.email,
        job.data.fullName,
        job.data.jobTitle as string,
      );
      break;
    case "sendAccountDeletionConfirmation":
      await emailService.sendAccountDeletionConfirmation(
        userId,
        job.data.email,
        job.data.fullName,
      );
      break;
    case "sendAccountDeactivationConfirmation":
      await emailService.sendAccountDeactivationConfirmation(
        userId,
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
