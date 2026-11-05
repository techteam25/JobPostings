import type { ApplicationInsightsPort } from "@shared/ports/application-insights.port";
import type { JobInsightsRepositoryPort } from "@/modules/job-board";

/**
 * Adapter that bridges the shared ApplicationInsightsPort to the
 * job-board module's JobInsightsRepository.
 *
 * Used by the domain-event worker to resync application counts
 * without importing job-board internals directly.
 */
export class JobBoardToSharedInsightsAdapter implements ApplicationInsightsPort {
  constructor(
    private readonly jobInsightsRepository: Pick<
      JobInsightsRepositoryPort,
      "syncJobApplicationCount"
    >,
  ) {}

  async syncJobApplicationCount(jobId: number): Promise<void> {
    await this.jobInsightsRepository.syncJobApplicationCount(jobId);
  }
}
