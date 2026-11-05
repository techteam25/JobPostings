import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth-server";
import { getPostAuthRedirectUrl } from "@/lib/post-auth-redirect";
import { parseSessionCookie } from "@/lib/session-cookie";

/**
 * OAuth callback landing page. Better Auth always redirects to a fixed
 * callbackURL after social sign-in; this page mirrors email-login's
 * redirectUrl by routing from intent + onboardingStatus.
 */
export default async function PostLoginPage() {
  const cookieHeader = (await headers()).get("cookie");
  const parsed = parseSessionCookie(cookieHeader);

  if (!parsed) {
    redirect("/sign-in");
  }

  if (parsed.kind === "full") {
    redirect(
      getPostAuthRedirectUrl(parsed.user.intent, parsed.user.onboardingStatus),
    );
  }

  // session_data cache missing (e.g. cookieCache disabled in tests/dev) —
  // fall back to a live session fetch which includes additionalFields.
  const session = await getServerSession(cookieHeader);
  if (!session.user) {
    redirect("/sign-in");
  }

  const intent = session.user.intent === "employer" ? "employer" : "seeker";
  const onboardingStatus =
    session.user.onboardingStatus === "completed" ? "completed" : "pending";

  redirect(getPostAuthRedirectUrl(intent, onboardingStatus));
}
