import { Job as BullMqJob } from "bullmq";
import logger from "@shared/logger";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { InvitationsRepositoryPort } from "@/modules/invitations";
import type { ModuleWorkers } from "@shared/types/module-workers";

interface InvitationExpirationWorkerDeps {
  invitationsRepository: Pick<
    InvitationsRepositoryPort,
    "expirePendingInvitations"
  >;
}

function createExpirationHandler(deps: InvitationExpirationWorkerDeps) {
  return async function expireInvitationsWorker(
    _job: BullMqJob,
  ): Promise<{ expired: number }> {
    logger.info("Starting invitation expiration job");

    try {
      const expiredCount =
        await deps.invitationsRepository.expirePendingInvitations();

      logger.info({ expiredCount }, "Invitation expiration job completed");
      return { expired: expiredCount };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error({ error: errorMessage }, "Invitation expiration job failed");
      throw error;
    }
  };
}

export function createInvitationExpirationWorker(
  deps: InvitationExpirationWorkerDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<
        { correlationId: string },
        { expired: number }
      >(
        QUEUE_NAMES.INVITATION_EXPIRATION_QUEUE,
        createExpirationHandler(deps),
        {
          concurrency: 1,
        },
      );

      logger.info("Invitation expiration worker initialized");
    },

    async scheduleJobs() {
      try {
        await queueService.addJob(
          QUEUE_NAMES.INVITATION_EXPIRATION_QUEUE,
          "expireInvitations",
          {},
          {
            repeat: {
              pattern: "0 6 * * *",
            },
            jobId: "invitation-expiration",
          },
        );
        logger.info(
          "Scheduled invitation expiration job (daily at 6:00 AM UTC)",
        );
      } catch (error) {
        logger.error({ error }, "Failed to schedule invitation expiration job");
      }
    },
  };
}
