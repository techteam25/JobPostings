import { OrganizationsRepository } from "./repositories/organizations.repository";
import { OrganizationsService } from "./services/organizations.service";
import { OrganizationsController } from "./controllers/organizations.controller";
import { createOrganizationsGuards } from "./guards/organizations.guards";
import { createTypesenseEmployerIndexerWorker } from "./workers/typesense-employer-indexer.worker";
import type { IntentSyncPort } from "./ports/intent-sync.port";
import type { TypesenseEmployerServicePort } from "@shared/ports/typesense-employer-service.port";

interface OrganizationsModuleDeps {
  intentSync: IntentSyncPort;
  organizationsRepository: OrganizationsRepository;
  typesenseEmployerService: TypesenseEmployerServicePort;
}

/**
 * Composition root for the Organizations module.
 *
 * Creates and wires all internal dependencies, returning the fully-built
 * controller, guards, service, and repository. The repository and service
 * are exposed so the central composition root can create cross-module adapters.
 */
export function createOrganizationsModule(deps: OrganizationsModuleDeps) {
  const repository = deps.organizationsRepository;
  const service = new OrganizationsService(repository, deps.intentSync);
  const controller = new OrganizationsController(service);
  const guards = createOrganizationsGuards({
    organizationsRepository: repository,
  });

  const workers = createTypesenseEmployerIndexerWorker({
    typesenseEmployerService: deps.typesenseEmployerService,
  });

  return { controller, service, guards, repository, workers };
}

export type OrganizationsModule = ReturnType<typeof createOrganizationsModule>;
