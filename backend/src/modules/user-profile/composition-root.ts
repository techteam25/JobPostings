import type { OrgRoleQueryPort, UserOrganizationsQueryPort } from "./ports/org-query.port";

import { ProfileRepository } from "./repositories/profile.repository";
import { ProfileService } from "./services/profile.service";
import { ProfileController } from "./controllers/profile.controller";
import { createProfileGuards } from "./guards/profile.guards";

interface UserProfileModuleDeps {
  orgRoleQuery: OrgRoleQueryPort;
  userOrgsQuery: UserOrganizationsQueryPort;
}

/**
 * Composition root for the User-Profile module.
 *
 * Receives cross-module query ports (from Organizations via adapters)
 * and wires internal dependencies.
 */
export function createUserProfileModule(deps: UserProfileModuleDeps) {
  const repository = new ProfileRepository();
  const service = new ProfileService(repository, deps.orgRoleQuery);
  const controller = new ProfileController(service, deps.userOrgsQuery);
  const guards = createProfileGuards({ profileRepository: repository });

  return { controller, guards, repository };
}

export type UserProfileModule = ReturnType<typeof createUserProfileModule>;
