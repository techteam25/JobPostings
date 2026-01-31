# Background Workers

This directory contains background worker implementations using BullMQ for asynchronous job processing.

## Overview

Workers handle time-consuming or scheduled tasks asynchronously, improving API response times and enabling background processing. The application uses Redis as the queue backend and BullMQ for job management.

## Available Workers

- **Email Worker** (`send-email-worker.ts`): Processes email notifications
- **TypeSense Indexer** (`typesense-job-indexer.ts`): Indexes job postings for search
- **File Upload Worker** (`file-upload-worker.ts`): Handles file uploads to Firebase
- **Job Alert Processor** (`job-alert-processor.ts`): Matches jobs with user alerts (scheduled)
- **Temp File Cleanup** (`temp-file-cleanup-worker.ts`): Removes temporary files (scheduled)
- **Inactive User Alert Pauser** (`inactive-user-alert-pauser.ts`): Pauses alerts for inactive users (scheduled)

## Creating a New Worker

Follow these steps to create and register a new background worker:

### Step 1: Add a Queue to the Queue Service

First, add your queue name to the `QUEUE_NAMES` constant in `src/infrastructure/queue.service.ts`:

```typescript
// src/infrastructure/queue.service.ts

export const QUEUE_NAMES = {
  TYPESENSE_QUEUE: "jobIndexQueue",
  EMAIL_QUEUE: "emailQueue",
  FILE_UPLOAD_QUEUE: "fileUploadQueue",
  TEMP_FILE_CLEANUP_QUEUE: "tempFileCleanupQueue",
  JOB_ALERT_QUEUE: "jobAlertQueue",
  // Add your new queue
  NOTIFICATION_QUEUE: "notificationQueue",
} as const;
```

Then, create the queue in the `initialize()` method:

```typescript
// src/infrastructure/queue.service.ts

async initialize(): Promise<void> {
  if (this.isInitialized) {
    logger.info("Queue service already initialized");
    return;
  }

  try {
    // Create existing queues...
    this.createQueue(QUEUE_NAMES.TYPESENSE_QUEUE);
    this.createQueue(QUEUE_NAMES.EMAIL_QUEUE);
    this.createQueue(QUEUE_NAMES.FILE_UPLOAD_QUEUE);
    this.createQueue(QUEUE_NAMES.TEMP_FILE_CLEANUP_QUEUE);
    this.createQueue(QUEUE_NAMES.JOB_ALERT_QUEUE);
    
    // Create your new queue
    this.createQueue(QUEUE_NAMES.NOTIFICATION_QUEUE);

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
```

### Step 2: Create the Worker File

Create a new file in the `src/workers/` directory:

```typescript
// src/workers/notification-worker.ts

import { Job as BullMqJob } from "bullmq";
import logger from "@/logger";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

/**
 * Type definition for notification job data
 */
type NotificationJobData = {
  userId: number;
  type: "push" | "sms" | "in-app";
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

/**
 * Worker function to process notification jobs.
 * This function is called for each job in the queue.
 * 
 * @param job The BullMQ job containing notification data
 * @returns Promise that resolves when notification is sent
 */
export async function processNotification(
  job: BullMqJob<NotificationJobData>
): Promise<void> {
  const { userId, type, title, message, data } = job.data;

  logger.info(`Processing ${type} notification for user ${userId}`, {
    jobId: job.id,
    type,
  });

  try {
    switch (type) {
      case "push":
        // Implement push notification logic
        await sendPushNotification(userId, title, message, data);
        break;
      case "sms":
        // Implement SMS notification logic
        await sendSMSNotification(userId, message);
        break;
      case "in-app":
        // Implement in-app notification logic
        await createInAppNotification(userId, title, message, data);
        break;
      default:
        logger.error(`Unknown notification type: ${type}`);
        throw new Error(`Unknown notification type: ${type}`);
    }

    logger.info(`Successfully sent ${type} notification to user ${userId}`);
  } catch (error) {
    logger.error(`Failed to send ${type} notification to user ${userId}`, {
      error: error instanceof Error ? error.message : "Unknown error",
      jobId: job.id,
    });
    throw error; // Re-throw to trigger retry logic
  }
}

/**
 * Initialize the notification worker.
 * This registers the worker with the queue service.
 */
export function initializeNotificationWorker(): void {
  queueService.registerWorker<NotificationJobData, void>(
    QUEUE_NAMES.NOTIFICATION_QUEUE,
    processNotification,
    {
      concurrency: 10, // Process 10 notifications concurrently
      limiter: {
        max: 100, // Max 100 notifications
        duration: 60000, // per minute
      },
    }
  );

  logger.info("Notification worker initialized");
}

// Helper functions (implement based on your notification service)
async function sendPushNotification(
  userId: number,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  // Implementation here
}

async function sendSMSNotification(userId: number, message: string): Promise<void> {
  // Implementation here
}

async function createInAppNotification(
  userId: number,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  // Implementation here
}
```

### Step 3: Register the Worker in the Application

Add the worker initialization to `src/app.ts`:

```typescript
// src/app.ts

import { initializeEmailWorker } from "@/workers/send-email-worker";
import { initializeTypesenseWorker } from "@/workers/typesense-job-indexer";
import { initializeFileUploadWorker } from "@/workers/file-upload-worker";
import { initializeFileCleanupWorker } from "@/workers/temp-file-cleanup-worker";
import { initializeJobAlertWorker } from "@/workers/job-alert-processor";
import { initializeInactiveUserAlertWorker } from "@/workers/inactive-user-alert-pauser";
// Import your new worker
import { initializeNotificationWorker } from "@/workers/notification-worker";

// Initialize queue service and workers
try {
  queueService.initialize().catch((err) => logger.error(err));
  initializeTypesenseWorker();
  initializeFileUploadWorker();
  initializeEmailWorker();
  initializeFileCleanupWorker();
  initializeJobAlertWorker();
  initializeInactiveUserAlertWorker();
  // Initialize your new worker
  initializeNotificationWorker();
  logger.info("Queue service and workers initialized");
} catch (error) {
  logger.warn(
    "Queue service initialization failed",
    {
      error: error instanceof Error ? error.message : "Unknown error",
    }
  );
}
```

### Step 4: Use the Worker in a Service

Add jobs to the queue from your service layer:

```typescript
// src/services/user.service.ts

import { queueService } from "@/infrastructure/queue.service";
import { QUEUE_NAMES } from "@/infrastructure/queue.service";
import logger from "@/logger";

export class UserService {
  /**
   * Send a welcome notification to a new user
   */
  async sendWelcomeNotification(userId: number): Promise<void> {
    try {
      await queueService.addJob(
        QUEUE_NAMES.NOTIFICATION_QUEUE,
        "welcome-notification",
        {
          userId,
          type: "push" as const,
          title: "Welcome!",
          message: "Thanks for joining our platform",
          data: {
            action: "view_profile",
          },
        },
        {
          // Optional: Job options
          priority: 1, // Higher priority
          delay: 5000, // Delay 5 seconds
          attempts: 3, // Retry up to 3 times on failure
        }
      );

      logger.info(`Queued welcome notification for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to queue welcome notification for user ${userId}`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Don't throw - notification failure shouldn't break user creation
    }
  }
}
```

## Creating Scheduled Workers

For workers that need to run on a schedule (e.g., daily cleanup, weekly reports), use BullMQ's repeat option:

### Example: Scheduled Report Generator

```typescript
// src/workers/report-generator.ts

import { Job as BullMqJob } from "bullmq";
import logger from "@/logger";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

/**
 * Type definition for report job data
 */
type ReportJobData = {
  reportType: "daily" | "weekly" | "monthly";
  startDate: string;
  endDate: string;
};

/**
 * Worker function to generate reports
 */
export async function processReport(
  job: BullMqJob<ReportJobData>
): Promise<{ generated: boolean; reportId: string }> {
  const { reportType, startDate, endDate } = job.data;

  logger.info(`Generating ${reportType} report`, {
    jobId: job.id,
    dateRange: { startDate, endDate },
  });

  try {
    // Fetch data for the report
    const data = await fetchReportData(startDate, endDate);

    // Generate the report
    const reportId = await generateReport(reportType, data);

    // Store report in database
    await saveReport(reportId, reportType, startDate, endDate);

    // Notify administrators
    await notifyAdministrators(reportType, reportId);

    logger.info(`Successfully generated ${reportType} report: ${reportId}`);

    return { generated: true, reportId };
  } catch (error) {
    logger.error(`Failed to generate ${reportType} report`, {
      error: error instanceof Error ? error.message : "Unknown error",
      jobId: job.id,
    });
    throw error;
  }
}

/**
 * Initialize the report generator worker
 */
export function initializeReportWorker(): void {
  queueService.registerWorker<
    ReportJobData,
    { generated: boolean; reportId: string }
  >(
    QUEUE_NAMES.REPORT_QUEUE,
    processReport,
    {
      concurrency: 1, // Process one report at a time
      limiter: {
        max: 5, // Max 5 reports
        duration: 60000, // per minute
      },
    }
  );

  logger.info("Report generator worker initialized");
}

/**
 * Schedule daily report generation (runs every day at 2:00 AM)
 */
export async function scheduleDailyReport(): Promise<void> {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    await queueService.addJob(
      QUEUE_NAMES.REPORT_QUEUE,
      "daily-report",
      {
        reportType: "daily" as const,
        startDate: yesterday.toISOString(),
        endDate: now.toISOString(),
      },
      {
        repeat: {
          pattern: "0 2 * * *", // Cron expression: Every day at 2:00 AM
        },
        jobId: "daily-report-generation", // Prevent duplicate jobs
      }
    );

    logger.info("📅 Scheduled daily report generation (2:00 AM daily)");
  } catch (error) {
    logger.error("Failed to schedule daily report generation", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Schedule weekly report generation (runs every Monday at 3:00 AM)
 */
export async function scheduleWeeklyReport(): Promise<void> {
  try {
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    await queueService.addJob(
      QUEUE_NAMES.REPORT_QUEUE,
      "weekly-report",
      {
        reportType: "weekly" as const,
        startDate: lastWeek.toISOString(),
        endDate: now.toISOString(),
      },
      {
        repeat: {
          pattern: "0 3 * * 1", // Cron expression: Every Monday at 3:00 AM
        },
        jobId: "weekly-report-generation",
      }
    );

    logger.info("📅 Scheduled weekly report generation (3:00 AM every Monday)");
  } catch (error) {
    logger.error("Failed to schedule weekly report generation", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Schedule monthly report generation (runs on 1st of each month at 4:00 AM)
 */
export async function scheduleMonthlyReport(): Promise<void> {
  try {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    await queueService.addJob(
      QUEUE_NAMES.REPORT_QUEUE,
      "monthly-report",
      {
        reportType: "monthly" as const,
        startDate: lastMonth.toISOString(),
        endDate: now.toISOString(),
      },
      {
        repeat: {
          pattern: "0 4 1 * *", // Cron expression: 1st of every month at 4:00 AM
        },
        jobId: "monthly-report-generation",
      }
    );

    logger.info("📅 Scheduled monthly report generation (4:00 AM on 1st of month)");
  } catch (error) {
    logger.error("Failed to schedule monthly report generation", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Helper functions
async function fetchReportData(startDate: string, endDate: string): Promise<any> {
  // Implementation
}

async function generateReport(type: string, data: any): Promise<string> {
  // Implementation - returns report ID
  return `report-${Date.now()}`;
}

async function saveReport(
  reportId: string,
  type: string,
  startDate: string,
  endDate: string
): Promise<void> {
  // Implementation
}

async function notifyAdministrators(type: string, reportId: string): Promise<void> {
  // Implementation
}
```

### Register Scheduled Jobs in app.ts

```typescript
// src/app.ts

import {
  initializeReportWorker,
  scheduleDailyReport,
  scheduleWeeklyReport,
  scheduleMonthlyReport,
} from "@/workers/report-generator";

// Initialize workers
try {
  queueService.initialize().catch((err) => logger.error(err));
  // ... other workers
  initializeReportWorker();
  logger.info("Queue service and workers initialized");
} catch (error) {
  logger.warn("Queue service initialization failed", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
}

// Schedule recurring jobs
try {
  scheduleDailyReport().catch((err) => logger.error(err));
  scheduleWeeklyReport().catch((err) => logger.error(err));
  scheduleMonthlyReport().catch((err) => logger.error(err));
} catch (error) {
  logger.warn("Failed to schedule background jobs", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
}
```

## Cron Pattern Reference

Common cron patterns for scheduled jobs:

```typescript
// Every minute
"* * * * *"

// Every 5 minutes
"*/5 * * * *"

// Every hour at minute 30
"30 * * * *"

// Every day at 2:00 AM
"0 2 * * *"

// Every Monday at 9:00 AM
"0 9 * * 1"

// Every 1st of the month at midnight
"0 0 1 * *"

// Every weekday at 6:00 PM
"0 18 * * 1-5"

// Every 15 minutes during business hours (9 AM - 5 PM)
"*/15 9-17 * * *"
```

Format: `"minute hour day-of-month month day-of-week"`

## Worker Configuration Options

When registering a worker, you can configure:

```typescript
queueService.registerWorker<JobDataType, ReturnType>(
  QUEUE_NAMES.YOUR_QUEUE,
  processorFunction,
  {
    // Number of jobs to process concurrently
    concurrency: 5,
    
    // Rate limiting
    limiter: {
      max: 100,        // Maximum jobs
      duration: 60000, // Per time period (ms)
    },
  }
);
```

## Job Options

When adding jobs to a queue, you can specify:

```typescript
await queueService.addJob(
  QUEUE_NAMES.YOUR_QUEUE,
  "job-name",
  { /* job data */ },
  {
    // Retry configuration
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000, // Initial delay in ms
    },
    
    // Priority (lower number = higher priority)
    priority: 1,
    
    // Delay before processing
    delay: 5000, // 5 seconds
    
    // Remove completed jobs
    removeOnComplete: {
      count: 100,  // Keep last 100
      age: 3600,   // Keep for 1 hour (seconds)
    },
    
    // Remove failed jobs
    removeOnFail: {
      count: 500,
    },
    
    // Scheduled/recurring jobs
    repeat: {
      pattern: "0 2 * * *", // Cron pattern
    },
    
    // Unique job ID (prevents duplicates)
    jobId: "unique-job-identifier",
  }
);
```

## Best Practices

1. **Error Handling**: Always use try-catch and re-throw errors to enable retry logic
2. **Logging**: Log job start, completion, and failures with context
3. **Type Safety**: Define TypeScript types for job data
4. **Idempotency**: Design workers to be safely retryable
5. **Concurrency**: Set appropriate concurrency based on resource usage
6. **Rate Limiting**: Protect external services with rate limits
7. **Job IDs**: Use unique jobIds for scheduled jobs to prevent duplicates
8. **Cleanup**: Configure job retention policies to avoid memory issues
9. **Monitoring**: Track queue metrics and failed jobs
10. **Testing**: Write tests for worker functions

## Monitoring Workers

Check queue metrics:

```typescript
const metrics = await queueService.getQueueMetrics(QUEUE_NAMES.YOUR_QUEUE);
console.log(metrics);
// {
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3,
//   delayed: 1,
//   total: 111
// }
```

## Troubleshooting

### Worker Not Processing Jobs

1. Verify worker is initialized in `app.ts`
2. Check Redis connection
3. Verify queue name matches
4. Check worker logs for errors

### Jobs Failing Repeatedly

1. Check error logs for root cause
2. Verify external service availability
3. Review retry configuration
4. Check for data validation issues

### High Queue Backlog

1. Increase worker concurrency
2. Add more worker instances
3. Optimize job processing logic
4. Check for bottlenecks in dependencies

## Related Documentation

- [Queue Service](../infrastructure/queue.service.ts)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)
