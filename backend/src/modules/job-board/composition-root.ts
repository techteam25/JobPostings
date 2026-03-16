import type { TypesenseServicePort } from "@shared/ports/typesense-service.port";
import type { ApplicationStatusQueryPort } from "./ports/application-status-query.port";
import type { OrgMembershipForJobPort } from "./ports/org-membership-for-job.port";
import type { UserContactQueryPort } from "./ports/user-contact-query.port";
import type { JobBoardRepositoryPort } from "./ports/job-board-repository.port";
import type { JobInsightsRepositoryPort } from "./ports/job-insights-repository.port";

import { JobBoardRepository } from "./repositories/job-board.repository";
import { JobInsightsRepository } from "./repositories/job-insights.repository";
import { JobBoardService } from "./services/job-board.service";
import { JobBoardController } from "./controllers/job-board.controller";
import { createJobBoardGuards } from "./guards/job-board.guards";

interface JobBoardModuleDeps {
  typesenseService: TypesenseServicePort;
  applicationStatusQuery: ApplicationStatusQueryPort;
  orgMembershipForJob: OrgMembershipForJobPort;
  userContactQuery: UserContactQueryPort;
  /** Optional: pass pre-created repos for circular dependency resolution */
  jobBoardRepository?: JobBoardRepositoryPort;
  jobInsightsRepository?: JobInsightsRepositoryPort;
}

/**
 * Composition root for the Job-Board module.
 *
 * Receives cross-module adapters and shared infrastructure. Optionally accepts
 * pre-created repositories when the central composition root needs to create
 * cross-module adapters before the module is fully wired (circular dep resolution).
 */
export function createJobBoardModule(deps: JobBoardModuleDeps) {
  const repository =
    deps.jobBoardRepository ??
    (new JobBoardRepository() as JobBoardRepositoryPort);
  const jobInsightsRepository =
    deps.jobInsightsRepository ??
    (new JobInsightsRepository() as JobInsightsRepositoryPort);

  const service = new JobBoardService(
    repository,
    jobInsightsRepository,
    deps.typesenseService,
    deps.applicationStatusQuery,
    deps.orgMembershipForJob,
    deps.userContactQuery,
  );
  const controller = new JobBoardController(service);
  const guards = createJobBoardGuards({
    jobBoardRepository: repository,
    orgMembershipQuery: deps.orgMembershipForJob,
  });

  return { controller, guards, repository, jobInsightsRepository };
}

export type JobBoardModule = ReturnType<typeof createJobBoardModule>;
