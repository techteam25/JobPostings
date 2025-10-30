import { Queue, QueueEvents, Worker, Job as BullMqJob } from "bullmq";

import logger from "@/logger";

import { env } from "@/config/env";
import { JobWithSkills } from "@/validations/job.validation";
import { TypesenseService } from "@/services/typesense.service/typesense.service";

const typesenseService = new TypesenseService();

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

const jobIndexerWorker = new Worker<JobWithSkills>(
  "jobIndexQueue",
  async (job: BullMqJob) => {
    const jobData = job.data as JobWithSkills;

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
  async (job: BullMqJob) => {},
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
