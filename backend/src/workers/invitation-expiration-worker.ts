import { Job as BullMqJob } from "bullmq";
import { eq, and, lt } from "drizzle-orm";
import logger from "@/logger";

import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";
import { db } from "@/db/connection";
import { organizationInvitations } from "@/db/schema";

/**
 * Worker function to expire pending invitations that have passed their expiration date.
 * Updates invitation status to 'expired' and sets expiredAt timestamp.
 */
export async function expireInvitationsWorker(_job: BullMqJob): Promise<{
  expired: number;
}> {
  logger.info("Starting invitation expiration job");

  try {
    const now = new Date();

    // Atomically update all expired pending invitations in a single query
    const result = await db
      .update(organizationInvitations)
      .set({
        status: "expired",
        expiredAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(organizationInvitations.status, "pending"),
          lt(organizationInvitations.expiresAt, now),
        ),
      );

    const expiredCount = result[0].affectedRows;

    logger.info({ expiredCount }, "Invitation expiration job completed");
    return { expired: expiredCount };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Invitation expiration job failed");
    throw error;
  }
}

/**
 * Initialize Invitation Expiration worker
 */
export function initializeInvitationExpirationWorker(): void {
  queueService.registerWorker<
    { correlationId: string },
    { expired: number }
  >(
    QUEUE_NAMES.INVITATION_EXPIRATION_QUEUE,
    expireInvitationsWorker,
    {
      concurrency: 1, // Process one expiration job at a time
    },
  );

  logger.info("Invitation expiration worker initialized");
}

/**
 * Schedule repeatable invitation expiration job (daily at midnight US Central Time).
 * Uses cron pattern: "0 6 * * *" which runs at 6:00 AM UTC (approximately midnight Central Time).
 */
export async function scheduleInvitationExpirationJob(): Promise<void> {
  try {
    await queueService.addJob(
      QUEUE_NAMES.INVITATION_EXPIRATION_QUEUE,
      "expireInvitations",
      {},
      {
        repeat: {
          pattern: "0 6 * * *", // 6 AM UTC = midnight Central Time (approx)
        },
        jobId: "invitation-expiration", // Prevent duplicate jobs
      },
    );
    logger.info(
      "📅 Scheduled invitation expiration job (daily at 6:00 AM UTC / midnight Central Time)",
    );
  } catch (error) {
    logger.error(
      { error },
      "Failed to schedule invitation expiration job",
    );
  }
}
