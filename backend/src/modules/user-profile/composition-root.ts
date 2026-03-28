import type {
  OrgRoleQueryPort,
  UserOrganizationsQueryPort,
} from "./ports/org-query.port";
import type { TypesenseUserProfileServicePort } from "@shared/ports/typesense-user-profile-service.port";

import { ProfileRepository } from "./repositories/profile.repository";
import { PreferenceRepository } from "./repositories/preference.repository";
import { WorkAreaRepository } from "./repositories/work-area.repository";
import { ProfileService } from "./services/profile.service";
import { PreferenceService } from "./services/preference.service";
import { WorkAreaService } from "./services/work-area.service";
import { ProfileController } from "./controllers/profile.controller";
import { PreferenceController } from "./controllers/preference.controller";
import { WorkAreaController } from "./controllers/work-area.controller";
import { createProfileGuards } from "./guards/profile.guards";
import { createTypesenseUserProfileIndexerWorker } from "./workers/typesense-user-profile-indexer.worker";

interface UserProfileModuleDeps {
  orgRoleQuery: OrgRoleQueryPort;
  userOrgsQuery: UserOrganizationsQueryPort;
  typesenseUserProfileService: TypesenseUserProfileServicePort;
}

/**
 * Composition root for the User-Profile module.
 *
 * Receives cross-module query ports (from Organizations via adapters)
 * and wires internal dependencies.
 */
export function createUserProfileModule(deps: UserProfileModuleDeps) {
  const repository = new ProfileRepository();
  const preferenceRepository = new PreferenceRepository();
  const workAreaRepository = new WorkAreaRepository();

  const service = new ProfileService(repository, deps.orgRoleQuery);
  const preferenceService = new PreferenceService(
    preferenceRepository,
    repository,
    workAreaRepository,
  );
  const workAreaService = new WorkAreaService(
    workAreaRepository,
    preferenceRepository,
    repository,
  );

  const controller = new ProfileController(service, deps.userOrgsQuery);
  const preferenceController = new PreferenceController(preferenceService);
  const workAreaController = new WorkAreaController(workAreaService);

  const guards = createProfileGuards({ profileRepository: repository });

  const workers = createTypesenseUserProfileIndexerWorker({
    typesenseUserProfileService: deps.typesenseUserProfileService,
  });

  return {
    controller,
    preferenceController,
    workAreaController,
    guards,
    repository,
    workers,
  };
}

export type UserProfileModule = ReturnType<typeof createUserProfileModule>;
