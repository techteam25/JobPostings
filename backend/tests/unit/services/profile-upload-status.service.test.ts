import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Queue } from "bullmq";

import { ProfileService } from "@/modules/user-profile/services/profile.service";
import type { ProfileRepositoryPort } from "@/modules/user-profile/ports/profile-repository.port";
import type { OrgRoleQueryPort } from "@/modules/user-profile/ports/org-query.port";
import type { IdentityWritePort } from "@/modules/user-profile/ports/identity-write.port";
import { queueService } from "@shared/infrastructure/queue.service";

vi.mock("@shared/db/connection", () => ({ db: {} }));
vi.mock("@shared/infrastructure/queue.service", () => ({
  QUEUE_NAMES: { FILE_UPLOAD_QUEUE: "fileUploadQueue" },
  queueService: { getQueue: vi.fn() },
}));
vi.mock(
  "@shared/infrastructure/typesense.service/candidate-search-enqueue",
  () => ({
    enqueueCandidateSearchSync: vi.fn(),
  }),
);

function service() {
  return new ProfileService(
    {} as ProfileRepositoryPort,
    {} as OrgRoleQueryPort,
    {} as IdentityWritePort,
  );
}

describe("profile upload status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the completed URL for the owner", async () => {
    const getState = vi.fn().mockResolvedValue("completed");
    vi.mocked(queueService.getQueue).mockReturnValue({
      getJob: vi.fn().mockResolvedValue({
        data: { userId: "42", entityType: "user" },
        getState,
        returnvalue: {
          urls: ["https://storage.example/resume.pdf"],
          successCount: 1,
          failureCount: 0,
        },
      }),
    } as unknown as Queue);

    const result = await service().getUploadStatus(42, "job-1");

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual({
        status: "completed",
        url: "https://storage.example/resume.pdf",
      });
    }
  });

  it("does not disclose another user's upload job", async () => {
    const getState = vi.fn();
    vi.mocked(queueService.getQueue).mockReturnValue({
      getJob: vi.fn().mockResolvedValue({
        data: { userId: "99", entityType: "user" },
        getState,
      }),
    } as unknown as Queue);

    const result = await service().getUploadStatus(42, "job-1");

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.statusCode).toBe(404);
    expect(getState).not.toHaveBeenCalled();
  });

  it("reports an all-failed worker result as failed", async () => {
    vi.mocked(queueService.getQueue).mockReturnValue({
      getJob: vi.fn().mockResolvedValue({
        data: { userId: "42", entityType: "user" },
        getState: vi.fn().mockResolvedValue("completed"),
        returnvalue: { urls: [], successCount: 0, failureCount: 1 },
      }),
    } as unknown as Queue);

    const result = await service().getUploadStatus(42, "job-1");

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value.status).toBe("failed");
  });
});
