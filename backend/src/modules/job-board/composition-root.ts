import type { TypesenseServicePort } from "@shared/ports/typesense-service.port";
import type { ApplicationStatusQueryPort } from "./ports/application-status-query.port";
import type { SavedJobsStatusQueryPort } from "./ports/saved-jobs-status-query.port";
import type { OrgMembershipForJobPort } from "./ports/org-membership-for-job.port";
import type { UserContactQueryPort } from "./ports/user-contact-query.port";
import type { JobBoardRepositoryPort } from "./ports/job-board-repository.port";
import type { JobInsightsRepositoryPort } from "./ports/job-insights-repository.port";

import { JobBoardService } from "./services/job-board.service";
import { JobBoardController } from "./controllers/job-board.controller";
import { createJobBoardGuards } from "./guards/job-board.guards";
import { createTypesenseJobIndexerWorker } from "./workers/typesense-job-indexer.worker";

interface JobBoardModuleDeps {
  typesenseService: TypesenseServicePort;
  applicationStatusQuery: ApplicationStatusQueryPort;
  savedJobsStatusQuery: SavedJobsStatusQueryPort;
  orgMembershipForJob: OrgMembershipForJobPort;
  userContactQuery: UserContactQueryPort;
  jobBoardRepository: JobBoardRepositoryPort;
  jobInsightsRepository: JobInsightsRepositoryPort;
}

/**
 * Composition root for the Job-Board module.
 *
 * Receives cross-module adapters, shared infrastructure, and pre-created
 * repositories from the central composition root.
 */
export function createJobBoardModule(deps: JobBoardModuleDeps) {
  const repository = deps.jobBoardRepository;
  const jobInsightsRepository = deps.jobInsightsRepository;

  const service = new JobBoardService(
    repository,
    jobInsightsRepository,
    deps.typesenseService,
    deps.applicationStatusQuery,
    deps.savedJobsStatusQuery,
    deps.orgMembershipForJob,
    deps.userContactQuery,
  );
  const controller = new JobBoardController(service);
  const guards = createJobBoardGuards({
    jobBoardRepository: repository,
    orgMembershipQuery: deps.orgMembershipForJob,
  });

  const workers = createTypesenseJobIndexerWorker({
    typesenseService: deps.typesenseService,
  });

  return { controller, guards, repository, jobInsightsRepository, workers };
}

export type JobBoardModule = ReturnType<typeof createJobBoardModule>;
