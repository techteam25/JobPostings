import { APIError } from "better-auth/api";
import type { IdentityServicePort } from "@/modules/identity";
import type { BetterAuthUser } from "@/utils/auth/types";

export interface BeforeDeleteAccountDeps {
  identityService: Pick<IdentityServicePort, "getBlockingOwnedOrgs">;
}

/**
 * Pure, testable hook handler for Better-Auth's `user.deleteUser.beforeDelete`.
 *
 * Blocks deletion when the user is the sole owner of any active organization.
 * Surfaces the blocking orgs in the error details so the frontend can render
 * deep-links to each org's danger zone for ownership transfer / deletion.
 */
export async function runBeforeDeleteAccount(
  user: BetterAuthUser,
  deps: BeforeDeleteAccountDeps,
): Promise<void> {
  const result = await deps.identityService.getBlockingOwnedOrgs(
    Number(user.id),
  );

  if (!result.isSuccess) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Failed to verify organization ownership before deletion",
    });
  }

  if (result.value.length > 0) {
    throw new APIError("BAD_REQUEST", {
      message:
        "You own organizations that must be transferred or deleted before you can delete your account.",
      details: { orgs: result.value },
    });
  }
}
