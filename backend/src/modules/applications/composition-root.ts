import type { EventBusPort } from "@shared/events/event-bus.port";
import type { JobDetailsQueryPort } from "./ports/job-details-query.port";
import type { OrgMembershipQueryPort } from "./ports/org-membership-query.port";
import type { ApplicantQueryPort } from "./ports/applicant-query.port";
import type { ApplicationsRepositoryPort } from "./ports/applications-repository.port";

import { ApplicationsService } from "./services/applications.service";
import { ApplicationsController } from "./controllers/applications.controller";
import { SavedJobService } from "./services/saved-job.service";
import { SavedJobController } from "./controllers/saved-job.controller";
import { createApplicationsGuards } from "./guards/applications.guards";
import type { SavedJobRepositoryPort } from "./ports/saved-job-repository.port";

interface ApplicationsModuleDeps {
  jobDetailsQuery: JobDetailsQueryPort;
  orgMembershipQuery: OrgMembershipQueryPort;
  applicantQuery: ApplicantQueryPort;
  eventBus: EventBusPort;
  applicationsRepository: ApplicationsRepositoryPort;
  savedJobRepository: SavedJobRepositoryPort;
}

/**
 * Composition root for the Applications module.
 *
 * Receives cross-module query ports, event bus, and pre-created repository
 * from the central composition root.
 */
export function createApplicationsModule(deps: ApplicationsModuleDeps) {
  const repository = deps.applicationsRepository;

  const service = new ApplicationsService(
    repository,
    deps.jobDetailsQuery,
    deps.orgMembershipQuery,
    deps.applicantQuery,
    deps.eventBus,
  );
  const controller = new ApplicationsController(service);

  const savedJobService = new SavedJobService(deps.savedJobRepository);
  const savedJobController = new SavedJobController(savedJobService);

  const guards = createApplicationsGuards({
    applicationsRepository: repository,
  });

  return { controller, savedJobController, guards, repository };
}

export type ApplicationsModule = ReturnType<typeof createApplicationsModule>;
