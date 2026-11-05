import { APIError } from "better-auth/api";
import type { IdentityServicePort } from "@/modules/identity";
import type { BetterAuthUser } from "@/utils/auth/types";

export interface BeforeDeleteAccountDeps {
  identityService: Pick<
    IdentityServicePort,
    "getWalkAwayOrgs" | "prepareWalkAway"
  >;
}

/**
 * Pure, testable hook handler for Better-Auth's `user.deleteUser.beforeDelete`.
 *
 * Walk-away rules: orgs with other active members block deletion (payload
 * lists blocking + will-be-deleted preview). Solo-owned orgs are torn down
 * (pending invites cancelled, org deleted) before the account delete proceeds.
 * If teardown aborts because a member appeared, deletion is refused as blocked.
 */
export async function runBeforeDeleteAccount(
  user: BetterAuthUser,
  deps: BeforeDeleteAccountDeps,
): Promise<void> {
  const result = await deps.identityService.prepareWalkAway(Number(user.id));

  if (!result.isSuccess) {
    if (result.error.details && typeof result.error.details === "object") {
      const details = result.error.details as {
        blocking?: unknown;
        willBeDeleted?: unknown;
      };
      throw new APIError("BAD_REQUEST", {
        message:
          result.error.message ||
          "You own organizations that must be transferred or deleted before you can delete your account.",
        details: {
          blocking: details.blocking ?? [],
          willBeDeleted: details.willBeDeleted ?? [],
          // Backward-compatible alias used by older clients
          orgs: details.blocking ?? [],
        },
      });
    }

    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Failed to verify organization ownership before deletion",
    });
  }
}
