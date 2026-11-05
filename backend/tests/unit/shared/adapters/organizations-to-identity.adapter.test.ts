import { describe, it, expect, vi, beforeEach } from "vitest";
import { fail, ok } from "@shared/result";
import { OrganizationsToIdentityAdapter } from "@shared/adapters/organizations-to-identity.adapter";

describe("OrganizationsToIdentityAdapter", () => {
  const classifyOwnedOrgs = vi.fn();
  const deleteOrganization = vi.fn();
  const cancelAllPendingForOrganization = vi.fn();

  let adapter: OrganizationsToIdentityAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new OrganizationsToIdentityAdapter({
      classifyOwnedOrgs,
    } as never);
    adapter.bindTeardown({
      deleteOrganization,
      cancelAllPendingForOrganization,
    });
  });

  it("completes teardown after cancel + re-check + delete", async () => {
    classifyOwnedOrgs.mockResolvedValue({
      blocking: [],
      willBeDeleted: [{ id: 7, name: "Solo", hasActiveAdmin: false }],
    });
    cancelAllPendingForOrganization.mockResolvedValue(
      ok({ cancelledCount: 1 }),
    );
    deleteOrganization.mockResolvedValue(
      ok({ message: "Organization deleted successfully" }),
    );

    await expect(adapter.teardownSoloOrgs(1, [7])).resolves.toBe("completed");

    expect(cancelAllPendingForOrganization).toHaveBeenCalledWith(7, 1);
    expect(deleteOrganization).toHaveBeenCalledWith(7);
  });

  it("aborts without deleting when a member appears before cancel", async () => {
    classifyOwnedOrgs.mockResolvedValue({
      blocking: [{ id: 7, name: "Solo", hasActiveAdmin: false }],
      willBeDeleted: [],
    });

    await expect(adapter.teardownSoloOrgs(1, [7])).resolves.toBe("aborted");

    expect(cancelAllPendingForOrganization).not.toHaveBeenCalled();
    expect(deleteOrganization).not.toHaveBeenCalled();
  });

  it("aborts without deleting when a member appears after invite cancel", async () => {
    classifyOwnedOrgs
      .mockResolvedValueOnce({
        blocking: [],
        willBeDeleted: [{ id: 7, name: "Solo", hasActiveAdmin: false }],
      })
      .mockResolvedValueOnce({
        blocking: [{ id: 7, name: "Solo", hasActiveAdmin: false }],
        willBeDeleted: [],
      });
    cancelAllPendingForOrganization.mockResolvedValue(
      ok({ cancelledCount: 0 }),
    );

    await expect(adapter.teardownSoloOrgs(1, [7])).resolves.toBe("aborted");

    expect(cancelAllPendingForOrganization).toHaveBeenCalledWith(7, 1);
    expect(deleteOrganization).not.toHaveBeenCalled();
  });

  it("propagates cancel failures", async () => {
    classifyOwnedOrgs.mockResolvedValue({
      blocking: [],
      willBeDeleted: [{ id: 7, name: "Solo", hasActiveAdmin: false }],
    });
    cancelAllPendingForOrganization.mockResolvedValue(
      fail(new Error("cancel failed")),
    );

    await expect(adapter.teardownSoloOrgs(1, [7])).rejects.toThrow(
      "cancel failed",
    );
    expect(deleteOrganization).not.toHaveBeenCalled();
  });
});
