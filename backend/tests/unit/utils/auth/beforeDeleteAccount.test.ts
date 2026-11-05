import { describe, it, expect, vi, beforeEach } from "vitest";
import { APIError } from "better-auth/api";
import { fail, ok } from "@shared/result";
import { DatabaseError, ValidationError } from "@shared/errors";
import { runBeforeDeleteAccount } from "@/utils/auth/hooks/beforeDeleteAccount";
import type { BetterAuthUser } from "@/utils/auth/types";

describe("runBeforeDeleteAccount", () => {
  const user = { id: "42" } as BetterAuthUser;
  let prepareWalkAway: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    prepareWalkAway = vi.fn();
  });

  it("allows deletion when walk-away preparation succeeds", async () => {
    prepareWalkAway.mockResolvedValue(ok(undefined));

    await expect(
      runBeforeDeleteAccount(user, {
        identityService: { prepareWalkAway, getWalkAwayOrgs: vi.fn() },
      }),
    ).resolves.toBeUndefined();

    expect(prepareWalkAway).toHaveBeenCalledWith(42);
  });

  it("blocks deletion with blocking and willBeDeleted lists", async () => {
    const classification = {
      blocking: [{ id: 10, name: "Team Org", hasActiveAdmin: true }],
      willBeDeleted: [{ id: 22, name: "Solo Org", hasActiveAdmin: false }],
    };
    prepareWalkAway.mockResolvedValue(
      fail(
        new ValidationError(
          "You own organizations that must be transferred or deleted before you can leave your account.",
          classification,
        ),
      ),
    );

    await expect(
      runBeforeDeleteAccount(user, {
        identityService: { prepareWalkAway, getWalkAwayOrgs: vi.fn() },
      }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(APIError);
      const apiErr = err as APIError & {
        body?: { details?: Record<string, unknown> };
      };
      expect(apiErr.body?.details).toEqual({
        blocking: classification.blocking,
        willBeDeleted: classification.willBeDeleted,
        orgs: classification.blocking,
      });
      return true;
    });
  });

  it("surfaces internal errors when preparation fails without walk-away details", async () => {
    prepareWalkAway.mockResolvedValue(
      fail(new DatabaseError("Failed to prepare organization walk-away")),
    );

    await expect(
      runBeforeDeleteAccount(user, {
        identityService: { prepareWalkAway, getWalkAwayOrgs: vi.fn() },
      }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(APIError);
      return true;
    });
  });
});
