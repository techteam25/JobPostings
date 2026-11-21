import { describe, expect, it, vi } from "vitest";

import { ProfileService } from "@/modules/user-profile/services/profile.service";
import type { ProfileRepositoryPort } from "@/modules/user-profile/ports/profile-repository.port";
import type { OrgRoleQueryPort } from "@/modules/user-profile/ports/org-query.port";
import type { IdentityWritePort } from "@/modules/user-profile/ports/identity-write.port";
import { ok } from "@shared/result";

vi.mock("@shared/db/connection", () => ({ db: {} }));
vi.mock("@shared/infrastructure/queue.service", () => ({
  QUEUE_NAMES: {},
  queueService: {},
}));
vi.mock(
  "@shared/infrastructure/typesense.service/candidate-search-enqueue",
  () => ({
    enqueueCandidateSearchSync: vi.fn(),
  }),
);

describe("profile intent initialization", () => {
  it("preserves an existing employer's completed onboarding on OAuth login", async () => {
    const repository = {
      initializeUserIntent: vi.fn().mockResolvedValue(undefined),
      getUserIntent: vi.fn().mockResolvedValue({
        intent: "employer",
        status: "completed",
      }),
    } as unknown as ProfileRepositoryPort;
    const identityWrite = {
      syncIntentToUser: vi.fn().mockResolvedValue(ok(undefined)),
    } as unknown as IdentityWritePort;
    const service = new ProfileService(
      repository,
      {} as OrgRoleQueryPort,
      identityWrite,
    );

    const result = await service.initializeUserIntent(42, "seeker");

    expect(result.isSuccess).toBe(true);
    expect(repository.initializeUserIntent).toHaveBeenCalledWith(42, "seeker");
    expect(identityWrite.syncIntentToUser).toHaveBeenCalledWith(
      42,
      "employer",
      "completed",
    );
  });
});
