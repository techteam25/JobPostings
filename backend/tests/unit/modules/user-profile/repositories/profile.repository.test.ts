import { describe, it, expect, vi } from "vitest";

import { SavedJobService } from "@/modules/applications/services/saved-job.service";
import type { SavedJobRepositoryPort } from "@/modules/applications/ports/saved-job-repository.port";

function createMockRepository(
  overrides: Partial<SavedJobRepositoryPort> = {},
): SavedJobRepositoryPort {
  return {
    getSavedJobsForUser: vi.fn(),
    saveJobForUser: vi.fn().mockResolvedValue({ success: true }),
    isJobSavedByUser: vi.fn(),
    countSavedJobs: vi.fn().mockResolvedValue(0),
    getSavedJobIdsForJobs: vi.fn(),
    unsaveJobForUser: vi.fn(),
    ...overrides,
  };
}

describe("SavedJobService.saveJobForCurrentUser - saved jobs limit", () => {
  it("returns failure when saved jobs >= 50", async () => {
    const repo = createMockRepository({
      countSavedJobs: vi.fn().mockResolvedValue(50),
    });
    const service = new SavedJobService(repo);

    const result = await service.saveJobForCurrentUser(1, 123);

    expect(result.isFailure).toBe(true);
    expect(result.error?.message).toMatch(
      /Saved jobs limit reached. You can save up to 50 jobs./,
    );
    expect(repo.saveJobForUser).not.toHaveBeenCalled();
  });

  it("saves successfully when under the limit", async () => {
    const repo = createMockRepository({
      countSavedJobs: vi.fn().mockResolvedValue(49),
    });
    const service = new SavedJobService(repo);

    const result = await service.saveJobForCurrentUser(1, 123);

    expect(result.isSuccess).toBe(true);
    expect(repo.saveJobForUser).toHaveBeenCalledWith(1, 123);
  });
});
