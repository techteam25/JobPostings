export { createNotificationsModule } from "./composition-root";
export type { NotificationsModule } from "./composition-root";
export { NotificationsService } from "./services/notifications.service";
export { NotificationsController } from "./controllers/notifications.controller";
export { NotificationsRepository } from "./repositories/notifications.repository";
export type { NotificationsServicePort } from "./ports/notifications-service.port";
export type { NotificationsRepositoryPort } from "./ports/notifications-repository.port";
export type { UserActivityQueryPort } from "./ports/user-activity-query.port";
