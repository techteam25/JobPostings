import type { EmailServicePort } from "@/ports/email-service.port";
import type { EventBusPort } from "@shared/events/event-bus.port";

import { IdentityRepository } from "./repositories/identity.repository";
import { IdentityService } from "./services/identity.service";
import { IdentityController } from "./controllers/identity.controller";
import { createIdentityGuards } from "./guards/identity.guards";

interface IdentityModuleDeps {
  emailService: EmailServicePort;
  eventBus: EventBusPort;
}

/**
 * Composition root for the Identity module.
 *
 * Receives shared infrastructure (email, event bus) and wires internal
 * dependencies. The repository is exposed for cross-module adapters.
 */
export function createIdentityModule(deps: IdentityModuleDeps) {
  const repository = new IdentityRepository();
  const service = new IdentityService(
    repository,
    deps.emailService,
    deps.eventBus,
  );
  const controller = new IdentityController(service);
  const guards = createIdentityGuards();

  return { controller, guards, repository };
}

export type IdentityModule = ReturnType<typeof createIdentityModule>;
