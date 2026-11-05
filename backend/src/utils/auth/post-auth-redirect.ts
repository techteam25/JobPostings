export type UserIntent = "seeker" | "employer";
export type OnboardingStatus = "pending" | "completed";

/**
 * Canonical post-auth landing path for email login and OAuth post-login routing.
 * Keep in sync with frontend/lib/post-auth-redirect.ts.
 */
export function getPostAuthRedirectUrl(
  intent: UserIntent,
  onboardingStatus: OnboardingStatus,
): string {
  if (intent === "employer") {
    return onboardingStatus === "completed"
      ? "/employer/organizations"
      : "/employer/onboarding";
  }
  return "/";
}
