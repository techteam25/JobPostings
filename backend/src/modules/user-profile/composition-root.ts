import type {
  OrgRoleQueryPort,
  UserOrganizationsQueryPort,
} from "./ports/org-query.port";
import type { IdentityWritePort } from "./ports/identity-write.port";
import type { TypesenseUserProfileServicePort } from "@shared/ports/typesense-user-profile-service.port";
import type { TypesenseProfileServicePort } from "@shared/ports/typesense-profile-service.port";

import { ProfileRepository } from "./repositories/profile.repository";
import { PreferenceRepository } from "./repositories/preference.repository";
import { WorkAreaRepository } from "./repositories/work-area.repository";
import { EducationRepository } from "./repositories/education.repository";
import { WorkExperienceRepository } from "./repositories/work-experience.repository";
import { CertificationRepository } from "./repositories/certification.repository";
import { SkillRepository } from "./repositories/skill.repository";
import { ProfileService } from "./services/profile.service";
import { PreferenceService } from "./services/preference.service";
import { WorkAreaService } from "./services/work-area.service";
import { EducationService } from "./services/education.service";
import { WorkExperienceService } from "./services/work-experience.service";
import { CertificationService } from "./services/certification.service";
import { SkillService } from "./services/skill.service";
import { ProfileController } from "./controllers/profile.controller";
import { PreferenceController } from "./controllers/preference.controller";
import { WorkAreaController } from "./controllers/work-area.controller";
import { EducationController } from "./controllers/education.controller";
import { WorkExperienceController } from "./controllers/work-experience.controller";
import { CertificationController } from "./controllers/certification.controller";
import { SkillController } from "./controllers/skill.controller";
import { createProfileGuards } from "./guards/profile.guards";
import { createTypesenseUserProfileIndexerWorker } from "./workers/typesense-user-profile-indexer.worker";
import { createTypesenseCandidateSearchIndexerWorker } from "./workers/typesense-candidate-search-indexer.worker";

interface UserProfileModuleDeps {
  orgRoleQuery: OrgRoleQueryPort;
  userOrgsQuery: UserOrganizationsQueryPort;
  identityWrite: IdentityWritePort;
  typesenseUserProfileService: TypesenseUserProfileServicePort;
  typesenseProfileService: TypesenseProfileServicePort;
  profileRepository: ProfileRepository;
}

/**
 * Composition root for the User-Profile module.
 *
 * Receives cross-module query ports (from Organizations via adapters)
 * and wires internal dependencies.
 */
export function createUserProfileModule(deps: UserProfileModuleDeps) {
  const repository = deps.profileRepository;
  const preferenceRepository = new PreferenceRepository();
  const workAreaRepository = new WorkAreaRepository();
  const educationRepository = new EducationRepository();
  const workExperienceRepository = new WorkExperienceRepository();
  const certificationRepository = new CertificationRepository();
  const skillRepository = new SkillRepository();

  const service = new ProfileService(
    repository,
    deps.orgRoleQuery,
    deps.identityWrite,
  );
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
  const educationService = new EducationService(
    educationRepository,
    repository,
  );
  const workExperienceService = new WorkExperienceService(
    workExperienceRepository,
    repository,
  );
  const certificationService = new CertificationService(
    certificationRepository,
    repository,
  );
  const skillService = new SkillService(skillRepository, repository);

  const controller = new ProfileController(service, deps.userOrgsQuery);
  const preferenceController = new PreferenceController(preferenceService);
  const workAreaController = new WorkAreaController(workAreaService);
  const educationController = new EducationController(educationService);
  const workExperienceController = new WorkExperienceController(
    workExperienceService,
  );
  const certificationController = new CertificationController(
    certificationService,
  );
  const skillController = new SkillController(skillService);

  const guards = createProfileGuards({ profileRepository: repository });

  const userProfileIndexerWorker = createTypesenseUserProfileIndexerWorker({
    typesenseUserProfileService: deps.typesenseUserProfileService,
  });

  const candidateSearchIndexerWorker =
    createTypesenseCandidateSearchIndexerWorker({
      typesenseProfileService: deps.typesenseProfileService,
      profileRepository: repository,
    });

  const workers: import("@shared/types/module-workers").ModuleWorkers = {
    initialize() {
      userProfileIndexerWorker.initialize();
      candidateSearchIndexerWorker.initialize();
    },
    async scheduleJobs() {
      await Promise.all([
        userProfileIndexerWorker.scheduleJobs(),
        candidateSearchIndexerWorker.scheduleJobs(),
      ]);
    },
  };

  return {
    controller,
    preferenceController,
    workAreaController,
    educationController,
    workExperienceController,
    certificationController,
    skillController,
    guards,
    repository,
    service,
    workers,
  };
}

export type UserProfileModule = ReturnType<typeof createUserProfileModule>;
