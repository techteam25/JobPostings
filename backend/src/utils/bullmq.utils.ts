import { Queue, QueueEvents, Worker, Job as BullMqJob } from "bullmq";

import logger from "@/logger";

import { env } from "@/config/env";
import { JobWithSkills } from "@/validations/job.validation";
import { TypesenseService } from "@/services/typesense.service/typesense.service";
import { EmailService } from "@/services/email.service";

const typesenseService = new TypesenseService();
const emailService = new EmailService();

export const jobIndexerQueueEvents = new QueueEvents("jobIndexQueue", {
  connection: { url: env.REDIS_URL },
});
const emailSenderQueueEvents = new QueueEvents("emailQueue", {
  connection: { url: env.REDIS_URL },
});

export const jobIndexerQueue = new Queue("jobIndexQueue", {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const emailSenderQueue = new Queue("emailQueue", {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 500,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

const jobIndexerWorker = new Worker(
  "jobIndexQueue",
  async (job: BullMqJob<JobWithSkills>) => {
    const jobData = job.data;

    if (job.name === "indexJob") {
      await typesenseService.indexJobDocument(jobData);
      return;
    }
    if (job.name === "updateJobIndex") {
      await typesenseService.updateJobDocumentById(`${jobData.id}`, jobData);
      return;
    }
    if (job.name === "deleteJobIndex") {
      await typesenseService.deleteJobDocumentById(`${jobData.id}`);
      return;
    }
  },
  {
    connection: {
      url: env.REDIS_URL,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

const emailSenderWorker = new Worker(
  "emailQueue",
  async (job: BullMqJob<{ email: string; fullName: string }>) => {
    switch (job.name) {
      case "sendWelcomeEmail":
        // await emailService.sendWelcomeEmail(job.data);
        break;
      case "sendPasswordResetEmail":
        // await emailService.sendPasswordResetEmail(job.data);
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

      default:
        logger.error(`Unknown email job type: ${job.name}`);
    }
  },
  {
    connection: {
      url: env.REDIS_URL,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

jobIndexerQueueEvents.on("completed", () => {
  // update statistics
  logger.info("Job completed");
});

emailSenderQueueEvents.on("completed", () => {
  // update statistics
});

jobIndexerQueueEvents.on("failed", ({ jobId, failedReason }) => {
  // update statistics
  logger.error(`Job Indexer Job ${jobId} failed: ${failedReason}`);
});

emailSenderQueueEvents.on("failed", ({ jobId, failedReason }) => {
  // update statistics
  logger.error(`Email Sender Job ${jobId} failed: ${failedReason}`);
});

jobIndexerWorker.on("error", (err) => {
  logger.error(err);
});

emailSenderWorker.on("error", (err) => {
  logger.error(err);
});

logger.info("🚀 Worker started for queue:" + jobIndexerWorker.name);
logger.info("🚀 Worker started for queue:" + emailSenderWorker.name);
