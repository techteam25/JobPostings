import {
  Queue,
  Worker,
  Job,
  QueueEvents,
  ConnectionOptions,
  JobsOptions,
} from "bullmq";
import { env } from "@/config/env";
import logger from "@/logger";

// BullMQ connection configuration
const connection: ConnectionOptions = {
  url: env.REDIS_QUEUE_URL,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Queue names
export const QUEUE_NAMES = {
  TYPESENSE_QUEUE: "jobIndexQueue",
  EMAIL_QUEUE: "emailQueue",
  FILE_UPLOAD_QUEUE: "fileUploadQueue",
  TEMP_FILE_CLEANUP_QUEUE: "tempFileCleanupQueue",
  JOB_ALERT_QUEUE: "jobAlertQueue",
  INVITATION_EXPIRATION_QUEUE: "invitationExpirationQueue",
} as const;

// Job options
export const JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: {
    count: 100, // Keep last 100 completed jobs
    age: 3600, // Keep for 1 hour
  },
  removeOnFail: {
    count: 500, // Keep last 500 failed jobs for debugging
  },
};

class QueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private isInitialized = false;

  /**
   * Initialize queue service - creates queues and sets up event listeners
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info("Queue service already initialized");
      return;
    }

    try {
      // Create queues
      this.createQueue(QUEUE_NAMES.TYPESENSE_QUEUE);
      this.createQueue(QUEUE_NAMES.EMAIL_QUEUE);
      this.createQueue(QUEUE_NAMES.FILE_UPLOAD_QUEUE);
      this.createQueue(QUEUE_NAMES.TEMP_FILE_CLEANUP_QUEUE);
      this.createQueue(QUEUE_NAMES.JOB_ALERT_QUEUE);
      this.createQueue(QUEUE_NAMES.INVITATION_EXPIRATION_QUEUE);

      this.isInitialized = true;
      logger.info("Queue service initialized successfully", {
        queues: Array.from(this.queues.keys()),
      });
    } catch (error) {
      logger.error("Failed to initialize queue service", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Create a new queue
   */
  private createQueue(queueName: string): void {
    const queue = new Queue(queueName, { connection });

    // Set up queue events
    const queueEvents = new QueueEvents(queueName, { connection });

    queueEvents.on("waiting", ({ jobId }) => {
      logger.debug("Job waiting", { queueName, jobId });
    });

    queueEvents.on("active", ({ jobId }) => {
      logger.debug("Job active", { queueName, jobId });
    });

    queueEvents.on("completed", ({ jobId }) => {
      logger.info("Job completed", { queueName, jobId });
    });

    queueEvents.on("failed", ({ jobId, failedReason }) => {
      logger.error("Job failed", {
        queueName,
        jobId,
        reason: failedReason,
      });
    });

    queueEvents.on("progress", ({ jobId, data }) => {
      logger.debug("Job progress", { queueName, jobId, progress: data });
    });

    this.queues.set(queueName, queue);
    this.queueEvents.set(queueName, queueEvents);

    logger.info("Queue created", { queueName });
  }

  /**
   * Register a worker for a queue
   */
  registerWorker<T = any, R = any>(
    queueName: string,
    processor: (job: Job<T>) => Promise<R>,
    options?: {
      concurrency?: number;
      limiter?: {
        max: number;
        duration: number;
      };
    },
  ): void {
    if (this.workers.has(queueName)) {
      logger.warn("Worker already registered for queue", { queueName });
      return;
    }

    const worker = new Worker<T, R>(queueName, processor, {
      connection,
      concurrency: options?.concurrency || 5,
      limiter: options?.limiter,
    });

    worker.on("completed", (job) => {
      logger.info("Worker completed job", {
        queueName,
        jobId: job.id,
        duration: Date.now() - job.timestamp,
      });
    });

    worker.on("failed", (job, err) => {
      logger.error("Worker failed job", {
        queueName,
        jobId: job?.id,
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    worker.on("error", (err) => {
      logger.error("Worker error", {
        queueName,
        error: err.message,
      });
    });

    this.workers.set(queueName, worker);
    logger.info("Worker registered", {
      queueName,
      concurrency: options?.concurrency || 5,
    });
  }

  /**
   * Add a job to a queue
   */
  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(jobName, data, {
      ...JOB_OPTIONS,
      ...options,
    });

    logger.info("Job added to queue", {
      queueName,
      jobId: job.id,
      delay: options?.delay,
      priority: options?.priority,
    });

    return job;
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get queue instance
   */
  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.pause();
    logger.info("Queue paused", { queueName });
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.resume();
    logger.info("Queue resumed", { queueName });
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(
    queueName: string,
    grace: number = 24 * 3600 * 1000, // 24 hours
    status: "completed" | "failed" = "completed",
  ): Promise<string[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const cleaned = await queue.clean(grace, 1000, status);
    logger.info("Queue cleaned", {
      queueName,
      status,
      count: cleaned.length,
    });
    return cleaned;
  }

  /**
   * Obliterate queue - removes all jobs and queue data
   */
  async obliterateQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);

    logger.info({ queue });
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.obliterate({ force: true });
    logger.warn("Queue obliterated", { queueName });
  }

  /**
   * Graceful shutdown - close all queues and workers
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down queue service...");

    // Close all workers first
    await Promise.all(
      Array.from(this.workers.values()).map((worker) => worker.close()),
    );

    // Close all queue events
    await Promise.all(
      Array.from(this.queueEvents.values()).map((qe) => qe.close()),
    );

    // Close all queues
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close()),
    );

    this.workers.clear();
    this.queueEvents.clear();
    this.queues.clear();
    this.isInitialized = false;

    logger.info("Queue service shutdown complete");
  }
}

export const queueService = new QueueService();
