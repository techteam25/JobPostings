import type { EmailServicePort } from "@shared/ports/email-service.port";
import type { TypesenseServicePort } from "@shared/ports/typesense-service.port";
import type { UserActivityQueryPort } from "./ports/user-activity-query.port";
import type { NotificationsRepositoryPort } from "./ports/notifications-repository.port";
import type { ModuleWorkers } from "@shared/types/module-workers";

import { NotificationsService } from "./services/notifications.service";
import { NotificationsController } from "./controllers/notifications.controller";
import { JobMatchingService } from "./services/job-matching.service";
import { createSendEmailWorker } from "./workers/send-email.worker";
import { createJobAlertProcessorWorker } from "./workers/job-alert-processor.worker";
import { createInactiveUserAlertPauserWorker } from "./workers/inactive-user-alert-pauser.worker";

interface NotificationsModuleDeps {
  emailService: EmailServicePort;
  userActivityQuery: UserActivityQueryPort;
  typesenseService: TypesenseServicePort;
  notificationsRepository: NotificationsRepositoryPort;
}

/**
 * Composition root for the Notifications module.
 *
 * Receives shared email service, typesense service (for job matching),
 * and a cross-module port to look up user contact information and activity.
 */
export function createNotificationsModule(deps: NotificationsModuleDeps) {
  const repository = deps.notificationsRepository;
  const service = new NotificationsService(
    repository,
    deps.emailService,
    deps.userActivityQuery,
  );
  const controller = new NotificationsController(service);

  // Workers
  const jobMatchingService = new JobMatchingService(deps.typesenseService);
  const emailWorker = createSendEmailWorker({
    emailService: deps.emailService,
  });
  const alertProcessorWorker = createJobAlertProcessorWorker({
    notificationsRepository: repository,
    jobMatchingService,
  });
  const inactiveUserAlertPauser = createInactiveUserAlertPauserWorker({
    userActivityQuery: deps.userActivityQuery,
    notificationsRepository: repository,
  });

  const workers: ModuleWorkers = {
    initialize() {
      emailWorker.initialize();
      alertProcessorWorker.initialize();
      inactiveUserAlertPauser.initialize();
    },
    async scheduleJobs() {
      await alertProcessorWorker.scheduleJobs();
      await inactiveUserAlertPauser.scheduleJobs();
    },
  };

  return { controller, service, repository, workers };
}

export type NotificationsModule = ReturnType<typeof createNotificationsModule>;
