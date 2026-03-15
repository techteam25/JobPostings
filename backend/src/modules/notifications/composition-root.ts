import type { EmailServicePort } from "@/ports/email-service.port";

import { NotificationsRepository } from "./repositories/notifications.repository";
import { NotificationsService } from "./services/notifications.service";
import { NotificationsController } from "./controllers/notifications.controller";

interface NotificationsModuleDeps {
  emailService: EmailServicePort;
  getUserContactInfo: (
    userId: number,
  ) => Promise<{ email: string; fullName: string } | null>;
}

/**
 * Composition root for the Notifications module.
 *
 * Receives shared email service and a cross-module callback to look up
 * user contact information (provided via an Identity adapter).
 */
export function createNotificationsModule(deps: NotificationsModuleDeps) {
  const repository = new NotificationsRepository();
  const service = new NotificationsService(
    repository,
    deps.emailService,
    deps.getUserContactInfo,
  );
  const controller = new NotificationsController(service);

  return { controller, service, repository };
}

export type NotificationsModule = ReturnType<typeof createNotificationsModule>;
