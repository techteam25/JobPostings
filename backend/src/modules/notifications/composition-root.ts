import type { EmailServicePort } from "@shared/ports/email-service.port";
import type { UserActivityQueryPort } from "./ports/user-activity-query.port";

import { NotificationsRepository } from "./repositories/notifications.repository";
import { NotificationsService } from "./services/notifications.service";
import { NotificationsController } from "./controllers/notifications.controller";

interface NotificationsModuleDeps {
  emailService: EmailServicePort;
  userActivityQuery: Pick<UserActivityQueryPort, "getUserContactInfo">;
}

/**
 * Composition root for the Notifications module.
 *
 * Receives shared email service and a cross-module port to look up
 * user contact information (provided via an Identity adapter).
 */
export function createNotificationsModule(deps: NotificationsModuleDeps) {
  const repository = new NotificationsRepository();
  const service = new NotificationsService(
    repository,
    deps.emailService,
    deps.userActivityQuery,
  );
  const controller = new NotificationsController(service);

  // No guards — notifications routes only require authentication (shared auth
  // middleware), not module-specific authorization guards.
  return { controller, service, repository };
}

export type NotificationsModule = ReturnType<typeof createNotificationsModule>;
