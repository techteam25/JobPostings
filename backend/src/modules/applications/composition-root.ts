import type { EventBusPort } from "@shared/events/event-bus.port";
import type { JobDetailsQueryPort } from "./ports/job-details-query.port";
import type { OrgMembershipQueryPort } from "./ports/org-membership-query.port";
import type { ApplicantQueryPort } from "./ports/applicant-query.port";
import type { ApplicationsRepositoryPort } from "./ports/applications-repository.port";

import { ApplicationsService } from "./services/applications.service";
import { ApplicationsController } from "./controllers/applications.controller";
import { createApplicationsGuards } from "./guards/applications.guards";

interface ApplicationsModuleDeps {
  jobDetailsQuery: JobDetailsQueryPort;
  orgMembershipQuery: OrgMembershipQueryPort;
  applicantQuery: ApplicantQueryPort;
  eventBus: EventBusPort;
  applicationsRepository: ApplicationsRepositoryPort;
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
  const guards = createApplicationsGuards({
    applicationsRepository: repository,
  });

  return { controller, guards, repository };
}

export type ApplicationsModule = ReturnType<typeof createApplicationsModule>;
