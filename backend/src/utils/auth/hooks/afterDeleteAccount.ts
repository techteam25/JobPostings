import type { EventBusPort } from "@shared/events";
import type { BetterAuthUser } from "@/utils/auth/types";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import { CacheService } from "@shared/infrastructure/cache.service";
import { createUserDeletedEvent } from "@/modules/identity";
import logger from "@shared/logger";

export interface AfterDeleteAccountDeps {
  eventBus: Pick<EventBusPort, "publish">;
}

/**
 * Pure, testable hook handler for Better-Auth's `user.deleteUser.afterDelete`.
 *
 * By the time this runs the user row is gone and Better-Auth has revoked
 * sessions. All work here is best-effort cleanup — rejections are logged
 * but do not abort the client response (Better-Auth 302-redirects to the
 * configured callbackURL regardless).
 *
 * - Queues the post-deletion confirmation email.
 * - Invalidates the (currently non-user-scoped — see bug 1266) 'users/me'
 *   cache key so a concurrent anonymous read can't return a stale hit.
 * - Publishes UserDeletedEvent for cross-module cleanup (Typesense
 *   unindex, etc.) — handled by the domain-event worker.
 * - Emits a logger.info breadcrumb as the interim audit record (full
 *   audit system tracked separately under task 602).
 */
export async function runAfterDeleteAccount(
  user: BetterAuthUser,
  deps: AfterDeleteAccountDeps,
): Promise<void> {
  const userId = Number(user.id);
  const deletedAt = new Date().toISOString();

  const results = await Promise.allSettled([
    queueService.addJob(
      QUEUE_NAMES.EMAIL_QUEUE,
      "sendAccountDeletionConfirmation",
      {
        userId,
        email: user.email,
        fullName: user.name,
      },
    ),
    CacheService.del("users/me"),
    deps.eventBus.publish(
      createUserDeletedEvent({
        userId,
        email: user.email,
        deletedAt,
      }),
    ),
  ]);

  results.forEach((r, idx) => {
    if (r.status === "rejected") {
      logger.error(
        { err: r.reason, step: idx, userId },
        "account.deletion.cleanup_failed",
      );
    }
  });

  logger.info(
    { userId, email: user.email, event: "account.deleted" },
    "User account deleted",
  );
}
