export { createNotificationsModule } from "./composition-root";
export type { NotificationsModule } from "./composition-root";
// Concrete export — used by app.ts and workers (Phase 8 will remove)
export { NotificationsRepository } from "./repositories/notifications.repository";
export type { NotificationsServicePort } from "./ports/notifications-service.port";
export type { NotificationsRepositoryPort } from "./ports/notifications-repository.port";
export type { UserActivityQueryPort } from "./ports/user-activity-query.port";
export { createNotificationsRoutes } from "./routes/notifications.routes";
