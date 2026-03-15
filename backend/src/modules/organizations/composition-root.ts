import { OrganizationsRepository } from "./repositories/organizations.repository";
import { OrganizationsService } from "./services/organizations.service";
import { OrganizationsController } from "./controllers/organizations.controller";
import { createOrganizationsGuards } from "./guards/organizations.guards";

/**
 * Composition root for the Organizations module.
 *
 * Creates and wires all internal dependencies, returning the fully-built
 * controller, guards, service, and repository. The repository and service
 * are exposed so the central composition root can create cross-module adapters.
 */
export function createOrganizationsModule() {
  const repository = new OrganizationsRepository();
  const service = new OrganizationsService(repository);
  const controller = new OrganizationsController(service);
  const guards = createOrganizationsGuards({
    organizationsRepository: repository,
  });

  return { controller, service, guards, repository };
}

export type OrganizationsModule = ReturnType<typeof createOrganizationsModule>;
