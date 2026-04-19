export { createIdentityModule } from "./composition-root";
export type { IdentityModule } from "./composition-root";
// Concrete export — still used by legacy facade services (Phase 9 will remove)
export { IdentityRepository } from "./repositories/identity.repository";
export type { IdentityServicePort } from "./ports/identity-service.port";
export type { IdentityRepositoryPort } from "./ports/identity-repository.port";
export { createIdentityGuards } from "./guards/identity.guards";
export type { IdentityGuards } from "./guards/identity.guards";
export { createIdentityRoutes } from "./routes/identity.routes";
export type { UserDeactivatedPayload } from "./events/user-deactivated.event";
export { createUserDeactivatedEvent } from "./events/user-deactivated.event";
export type { UserDeletedPayload } from "./events/user-deleted.event";
export { createUserDeletedEvent } from "./events/user-deleted.event";
export type { OrgOwnershipQueryPort } from "./ports/org-ownership-query.port";
