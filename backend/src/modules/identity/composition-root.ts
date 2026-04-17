import type { EmailServicePort } from "@shared/ports/email-service.port";
import type { EventBusPort } from "@shared/events/event-bus.port";

import { IdentityRepository } from "./repositories/identity.repository";
import { IdentityService } from "./services/identity.service";
import { IdentityController } from "./controllers/identity.controller";
import { createIdentityGuards } from "./guards/identity.guards";
import type { OrgOwnershipQueryPort } from "./ports/org-ownership-query.port";

interface IdentityModuleDeps {
  emailService: EmailServicePort;
  eventBus: EventBusPort;
  orgOwnershipQuery: OrgOwnershipQueryPort;
}

/**
 * Composition root for the Identity module.
 *
 * Receives shared infrastructure (email, event bus) and the cross-module
 * OrgOwnershipQueryPort (for sole-owner checks during account deletion).
 * The repository and service are exposed for cross-module adapters and
 * auth-hook wiring in the central composition root.
 */
export function createIdentityModule(deps: IdentityModuleDeps) {
  const repository = new IdentityRepository();
  const service = new IdentityService(
    repository,
    deps.emailService,
    deps.eventBus,
    deps.orgOwnershipQuery,
  );
  const controller = new IdentityController(service);
  const guards = createIdentityGuards();

  return { controller, guards, repository, service };
}

export type IdentityModule = ReturnType<typeof createIdentityModule>;
